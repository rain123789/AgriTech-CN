"""本地植物病害模型推理服务。

原项目提供 PyTorch 权重，但 root 页面实际调用的是浏览器端 MobileNet，
并且在加载失败时走到未定义的函数。本服务把权重接回可运行的 CPU 推理链路。

模型训练数据为公开 PlantVillage 数据集，共 38 类。它不等同于中国田间病害
验证集，界面必须展示适用范围与置信度，低置信度结果不得包装成确定诊断。
"""
from __future__ import annotations

import base64
import io
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
# 仅加载 state_dict 权重；-complete.pth 是依赖训练时类定义的完整序列化模型，无法独立加载。
MODEL_CANDIDATES = [
    BASE_DIR / "Plant Disease Detection" / "plant-disease-model.pth",
]

# 训练使用 torchvision ImageFolder，类别顺序即文件夹名字母序（Kaggle New Plant Diseases Dataset）。
# 此前打包内的打乱映射是错误来源之一，已按训练顺序重排。
LABELS: Dict[int, str] = {
    0: "Apple___Apple_scab",
    1: "Apple___Black_rot",
    2: "Apple___Cedar_apple_rust",
    3: "Apple___healthy",
    4: "Blueberry___healthy",
    5: "Cherry_(including_sour)___healthy",
    6: "Cherry_(including_sour)___Powdery_mildew",
    7: "Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot",
    8: "Corn_(maize)___Common_rust_",
    9: "Corn_(maize)___Northern_Leaf_Blight",
    10: "Corn_(maize)___healthy",
    11: "Grape___Black_rot",
    12: "Grape___Esca_(Black_Measles)",
    13: "Grape___healthy",
    14: "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    15: "Orange___Haunglongbing_(Citrus_greening)",
    16: "Peach___Bacterial_spot",
    17: "Peach___healthy",
    18: "Pepper,_bell___Bacterial_spot",
    19: "Pepper,_bell___healthy",
    20: "Potato___Early_blight",
    21: "Potato___Late_blight",
    22: "Potato___healthy",
    23: "Raspberry___healthy",
    24: "Soybean___healthy",
    25: "Squash___Powdery_mildew",
    26: "Strawberry___healthy",
    27: "Strawberry___Leaf_scorch",
    28: "Tomato___Bacterial_spot",
    29: "Tomato___Early_blight",
    30: "Tomato___Late_blight",
    31: "Tomato___Leaf_Mold",
    32: "Tomato___Septoria_leaf_spot",
    33: "Tomato___Spider_mites_Two-spotted_spider_mite",
    34: "Tomato___Target_Spot",
    35: "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    36: "Tomato___Tomato_mosaic_virus",
    37: "Tomato___healthy",
}

KNOWLEDGE: Dict[str, Dict[str, str]] = {
    "Tomato___Late_blight": {
        "name": "番茄晚疫病",
        "description": "由致病疫霉引起的流行性病害，湿度大时扩展快，叶片出现水浸状暗绿斑，可侵染茎和果实。",
        "treatment": "及时清除病株并带离田块，降低棚内湿度、改善通风，避免叶面长时间结露；具体药剂须由当地植保部门确认登记标签后使用。",
    },
    "Tomato___Early_blight": {
        "name": "番茄早疫病",
        "description": "常见真菌性叶斑病，老叶先出现带同心轮纹的褐色病斑，严重时影响产量。",
        "treatment": "摘除下部病叶并清出田外，合理密植、地面覆盖减少雨水飞溅，做好轮作与残体处理。",
    },
    "Tomato___healthy": {
        "name": "健康番茄",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续保持合理水肥、通风和巡查，发现异常叶片及时取样咨询。",
    },
    "Tomato___Septoria_leaf_spot": {
        "name": "番茄斑枯病（Septoria 叶斑）",
        "description": "叶片出现小型圆形斑点，中央灰白、边缘较深，通常由下部叶片向上发展。",
        "treatment": "清除病叶残体，避免叶面喷灌，保持行间通风；发病初期请当地植保人员指导防治。",
    },
    "Tomato___Leaf_Mold": {
        "name": "番茄叶霉病",
        "description": "设施栽培常见真菌病，叶背出现橄榄绿色霉层，湿度高时易流行。",
        "treatment": "优先降低湿度、增加通风和光照，及时摘除病叶，避免夜间叶面结露。",
    },
    "Tomato___Bacterial_spot": {
        "name": "番茄细菌性斑点病",
        "description": "叶片、茎和果实可出现小型暗色斑点，借雨水飞溅和带菌种子传播。",
        "treatment": "使用健康种子和种苗，避免大水漫灌和带水作业，清除病残体；铜制剂使用须确认登记标签。",
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "name": "番茄黄化曲叶病毒病",
        "description": "由烟粉虱传播的病毒病，表现为叶片黄化、卷曲和植株矮化，目前缺乏治疗性药剂。",
        "treatment": "重点防控烟粉虱、及时拔除病株，使用防虫网和健康苗；具体措施请结合当地监测预报。",
    },
    "Tomato___Tomato_mosaic_virus": {
        "name": "番茄花叶病毒病",
        "description": "叶片出现黄绿相间的花叶、皱缩，可通过汁液接触和工具传播。",
        "treatment": "拔除病株，工具和手部做好清洁消毒，避免连作与带病苗移栽，选用抗病品种。",
    },
    "Tomato___Target_Spot": {
        "name": "番茄靶斑病",
        "description": "叶片和果实出现带同心轮纹的圆形病斑，高湿条件下易扩展。",
        "treatment": "清除病残体、改善通风降湿，避免密植；药剂选择需遵循当地登记和标签要求。",
    },
    "Tomato___Spider_mites_Two-spotted_spider_mite": {
        "name": "番茄二斑叶螨",
        "description": "叶面出现密集失绿小点，严重时有细丝网，高温干燥条件易发生。",
        "treatment": "检查叶背虫口密度，优先使用生物防治和湿度管理；药剂应轮换并遵守安全间隔期。",
    },
    "Potato___Early_blight": {
        "name": "马铃薯早疫病",
        "description": "老叶出现带同心轮纹的暗褐色病斑，多在植株生长中后期发生。",
        "treatment": "合理轮作、清除病残体，保证氮磷钾平衡，避免植株早衰；防治用药遵循登记标签。",
    },
    "Potato___Late_blight": {
        "name": "马铃薯晚疫病",
        "description": "流行性强的卵菌病害，叶、茎和块茎均可受害，冷凉高湿时风险高。",
        "treatment": "选用健康种薯，及时清除病株，加强田间排水和通风；预警期防治须听从当地植保部门指导。",
    },
    "Potato___healthy": {
        "name": "健康马铃薯",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续保持合理水肥与巡查，注意块茎膨大期的水分均衡。",
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "name": "玉米大斑病",
        "description": "叶片出现长梭形灰褐色病斑，品种抗性和高湿条件影响发病程度。",
        "treatment": "选用抗病品种、合理密植并清除病残体；重发田块在专业人员指导下进行防治。",
    },
    "Corn_(maize)___Common_rust_": {
        "name": "玉米普通锈病",
        "description": "叶片出现红褐色夏孢子堆，凉爽高湿条件利于传播。",
        "treatment": "关注品种抗性，合理施肥避免贪青，发病初期请当地农技人员评估是否需要防治。",
    },
    "Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot": {
        "name": "玉米灰斑病",
        "description": "叶片形成受叶脉限制的灰色长条斑，高湿和连作会加重发生。",
        "treatment": "实行轮作、深翻病残体，选用抗病品种并改善田间通风。",
    },
    "Corn_(maize)___healthy": {
        "name": "健康玉米",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续做好水肥管理、病虫监测和田间记录。",
    },
    "Apple___Apple_scab": {
        "name": "苹果黑星病",
        "description": "叶片和果实表面出现橄榄黑色绒状病斑，春季多雨时易发。",
        "treatment": "清除落叶和病果，改善树冠通风透光，选用抗病品种并结合当地预报防治。",
    },
    "Apple___Black_rot": {
        "name": "苹果黑腐病",
        "description": "枝干溃疡、叶片褐斑和果实腐烂，病果可失水形成僵果。",
        "treatment": "剪除病枝、清除僵果，做好树体修剪和伤口保护，保持果园卫生。",
    },
    "Apple___Cedar_apple_rust": {
        "name": "苹果锈病",
        "description": "叶片出现橙黄色病斑，需在转主寄主与苹果之间完成生活史。",
        "treatment": "了解周边桧柏等转主寄主分布，清除病叶，结合当地物候期进行预防。",
    },
    "Apple___healthy": {
        "name": "健康苹果",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续做好果园巡查、平衡施肥和通风修剪。",
    },
    "Grape___Black_rot": {
        "name": "葡萄黑腐病",
        "description": "叶片褐斑、果实软腐并形成黑色僵果，高温高湿时传播较快。",
        "treatment": "清除僵果和病叶，改善架面通风，避免果园积水，按当地预报安排防治。",
    },
    "Grape___Esca_(Black_Measles)": {
        "name": "葡萄埃斯卡病（黑麻疹）",
        "description": "由多种木质部真菌引起的慢性病害，叶片出现条纹状坏死，树势逐渐衰弱。",
        "treatment": "重点在修剪工具消毒、伤口保护和病株管理，避免从病园采集繁殖材料。",
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "name": "葡萄叶枯病",
        "description": "叶片出现褐色斑点并可扩大融合，严重时造成早期落叶。",
        "treatment": "清除病叶、改善通风，避免叶面长时间潮湿，结合当地病情监测处理。",
    },
    "Grape___healthy": {
        "name": "健康葡萄",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续保持架面通风、合理负载和定期巡查。",
    },
    "Pepper,_bell___Bacterial_spot": {
        "name": "甜椒细菌性斑点病",
        "description": "叶片和果实出现水浸状小斑点，可借雨水和带菌种子传播。",
        "treatment": "使用健康种子种苗，避免带水作业和过密种植，清除病残体；药剂须遵循登记标签。",
    },
    "Pepper,_bell___healthy": {
        "name": "健康甜椒",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续维持均衡水肥、通风和病虫害监测。",
    },
    "Strawberry___Leaf_scorch": {
        "name": "草莓叶焦病",
        "description": "叶片出现紫褐色斑点并扩展，严重时叶缘焦枯，影响植株长势。",
        "treatment": "清除老叶病叶、改善通风，避免密植和叶面长期潮湿，使用健康苗。",
    },
    "Strawberry___healthy": {
        "name": "健康草莓",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续保持合理水肥、通风和果实期巡查。",
    },
    "Peach___Bacterial_spot": {
        "name": "桃细菌性穿孔病",
        "description": "叶片出现小型紫褐色斑点并可能脱落形成穿孔，果实也可受害。",
        "treatment": "清除病枝病叶，改善通风，避免雨水飞溅传播；防治措施结合当地登记药剂。",
    },
    "Peach___healthy": {
        "name": "健康桃树",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续做好修剪、清园和生长期巡查。",
    },
    "Cherry_(including_sour)___Powdery_mildew": {
        "name": "樱桃白粉病",
        "description": "幼叶和嫩梢表面出现白色粉状霉层，湿度适宜时扩散。",
        "treatment": "改善通风透光、控制氮肥，及时剪除病梢，注意合理使用登记药剂。",
    },
    "Cherry_(including_sour)___healthy": {
        "name": "健康樱桃",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续做好树体通风、平衡施肥和清园。",
    },
    "Orange___Haunglongbing_(Citrus_greening)": {
        "name": "柑橘黄龙病",
        "description": "由韧皮部细菌引起、经柑橘木虱传播的毁灭性病害，叶片斑驳黄化、果实畸形。",
        "treatment": "目前无有效治疗药剂，重点是使用无病苗木、防控木虱并按当地规定清除病株；必须联系当地植物检疫部门。",
    },
    "Blueberry___healthy": {
        "name": "健康蓝莓",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "保持适宜土壤 pH、水分和通风，定期巡查。",
    },
    "Raspberry___healthy": {
        "name": "健康树莓",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续保持通风、合理支撑和枝条更新。",
    },
    "Soybean___healthy": {
        "name": "健康大豆",
        "description": "模型未发现该数据集类别中的明显病害特征。",
        "treatment": "继续做好轮作、水肥和病虫害监测。",
    },
    "Squash___Powdery_mildew": {
        "name": "南瓜白粉病",
        "description": "叶片表面出现白色粉状霉层，通风不良和昼夜温差大时易发。",
        "treatment": "改善通风、避免过密和偏施氮肥，清除重病叶，按当地指导防治。",
    },
}


class PlantDiseaseService:
    def __init__(self) -> None:
        self.model = None
        self.device = "cpu"
        self.available = False
        self.error: Optional[str] = None
        self.model_path: Optional[str] = None
        self._torch = None
        self._transforms = None

    @property
    def classes(self) -> List[Dict[str, Any]]:
        result = []
        for index, label in sorted(LABELS.items()):
            info = KNOWLEDGE.get(
                label,
                {
                    "name": label.replace("___", " / ").replace("_", " "),
                    "description": "该类别暂无中文说明。",
                    "treatment": "请咨询当地农技部门。",
                },
            )
            result.append(
                {
                    "index": index,
                    "label": label,
                    "label_cn": info["name"],
                    "crop": label.split("___")[0].replace("_", " "),
                    "healthy": "healthy" in label.lower(),
                }
            )
        return result

    def load(self) -> bool:
        if self.available:
            return True
        model_path = next((path for path in MODEL_CANDIDATES if path.exists()), None)
        if not model_path:
            self.error = "未找到项目内的 PyTorch 病害模型文件。"
            logger.warning(self.error)
            return False
        try:
            import torch
            from torchvision import transforms

            self._torch = torch
            self._transforms = transforms
            payload = torch.load(str(model_path), map_location="cpu", weights_only=False)
            if isinstance(payload, dict):
                from model import PlantDiseaseNet

                model = PlantDiseaseNet(num_classes=len(LABELS))
                state_dict = payload
                if "state_dict" in payload and isinstance(payload["state_dict"], dict):
                    state_dict = payload["state_dict"]
                # 兼容 DataParallel 保存的 module. 前缀
                state_dict = {
                    (key[7:] if key.startswith("module.") else key): value
                    for key, value in state_dict.items()
                }
                # 结构已与训练权重对齐，strict=True：不匹配时立即报错，而不是静默输出无效结果
                model.load_state_dict(state_dict, strict=True)
            else:
                model = payload
            model.to(self.device)
            model.eval()
            self.model = model
            self.model_path = str(model_path)
            self.available = True
            self.error = None

            # 上游权重存在“所有输入都返回同一类”的可能，先做最低限度自检。
            # 自检失败时禁用推理，避免把健康类别伪装成有效诊断。
            if os.getenv("PLANT_MODEL_SELF_CHECK", "true").lower() in {"1", "true", "yes"}:
                self._self_check()

            logger.info("植物病害模型加载成功：%s", model_path)
            return self.available
        except Exception as exc:
            self.error = f"模型加载失败：{exc}"
            logger.warning(self.error)
            return False

    def _build_transform(self):
        # 训练时仅用 ToTensor（数据集本身 256x256，未做归一化）。
        # 加入 ImageNet Normalize 会使预测全部失效，实测已验证，勿加回。
        return self._transforms.Compose(
            [
                self._transforms.Resize((256, 256)),
                self._transforms.ToTensor(),
            ]
        )

    def _predict_image(self, image) -> List[float]:
        tensor = self._build_transform()(image).unsqueeze(0).to(self.device)

        with self._torch.no_grad():
            logits = self.model(tensor)
            if isinstance(logits, (tuple, list)):
                logits = logits[0]
            probabilities = self._torch.softmax(logits, dim=1)[0]
        return probabilities.tolist()

    def _self_check(self) -> None:
        """用项目自带的三张不同病害图做最小可用性检查。"""
        from PIL import Image

        samples = [
            ("Plant Disease Detection/test/TomatoEarlyBlight1.JPG", 29),
            ("Plant Disease Detection/test/PotatoEarlyBlight1.JPG", 20),
            ("Plant Disease Detection/test/CornCommonRust1.JPG", 8),
        ]
        predicted = []
        for relative_path, expected_index in samples:
            image_path = BASE_DIR / relative_path
            if not image_path.exists():
                continue
            try:
                probabilities = self._predict_image(Image.open(image_path).convert("RGB"))
                index = max(range(len(probabilities)), key=probabilities.__getitem__)
                predicted.append((index, expected_index, probabilities[index]))
            except Exception as exc:
                logger.warning("病害模型自检异常：%s", exc)

        if len(predicted) < 2:
            self.available = False
            self.error = "模型自检样本缺失，无法验证推理可靠性，已禁用图片识别。"
            return

        top_classes = {item[0] for item in predicted}
        matches = sum(1 for item in predicted if item[0] == item[1])
        if len(top_classes) <= 1:
            self.available = False
            self.error = (
                "上游病害权重自检失败：不同作物病害样本均被识别为同一类别，"
                "模型权重或标签映射可能损坏。为避免误导，图片识别已自动禁用。"
            )
            return
        if matches == 0:
            self.available = False
            self.error = (
                "上游病害权重自检未匹配任何已知样本，可能缺少正确的类别映射，"
                "图片识别已自动禁用。"
            )

    @staticmethod
    def _decode_base64(image_base64: str):
        from PIL import Image

        payload = image_base64.strip()
        if "," in payload and payload.lstrip().startswith("data:"):
            payload = payload.split(",", 1)[1]
        raw = base64.b64decode(payload, validate=True)
        if len(raw) > int(os.getenv("MAX_IMAGE_UPLOAD_SIZE_MB", "10")) * 1024 * 1024:
            raise ValueError("图片超过 10 MB 限制")
        image = Image.open(io.BytesIO(raw)).convert("RGB")
        if image.width < 32 or image.height < 32:
            raise ValueError("图片尺寸过小，无法识别")
        return image

    def predict_base64(self, image_base64: str) -> Dict[str, Any]:
        if not image_base64:
            return {"status": "error", "code": "no_image", "message": "未收到图片数据。"}
        if not self.available:
            if self.error:
                return {
                    "status": "unavailable",
                    "code": "model_unavailable",
                    "message": self.error,
                }
            if not self.load():
                return {
                    "status": "unavailable",
                    "code": "model_unavailable",
                    "message": self.error or "病害识别模型未就绪。",
                }
        try:
            image = self._decode_base64(image_base64)
            tensor = self._build_transform()(image).unsqueeze(0).to(self.device)

            with self._torch.no_grad():
                logits = self.model(tensor)
                if isinstance(logits, (tuple, list)):
                    logits = logits[0]
                probabilities = self._torch.softmax(logits, dim=1)[0]
                top_probabilities, top_indices = self._torch.topk(
                    probabilities, k=min(3, len(LABELS))
                )

            predictions = []
            for probability, index in zip(top_probabilities.tolist(), top_indices.tolist()):
                label = LABELS.get(int(index), str(index))
                info = KNOWLEDGE.get(label, {})
                predictions.append(
                    {
                        "label": label,
                        "label_cn": info.get("name", label),
                        "confidence": round(float(probability), 4),
                        "is_healthy": "healthy" in label.lower(),
                        "description": info.get("description", ""),
                        "treatment": info.get("treatment", ""),
                    }
                )

            top = predictions[0]
            return {
                "status": "ok",
                "prediction": top,
                "predictions": predictions,
                "low_confidence": top["confidence"] < 0.6,
                "model": {
                    "name": "PlantDiseaseNet (PyTorch)",
                    "classes": len(LABELS),
                    "dataset": "PlantVillage 38 类公开数据集",
                    "scope": "模型未使用中国田间数据验证，不构成田间诊断结论。",
                },
                "disclaimer": "图片识别仅为初步筛查，不能替代当地农技或植保部门诊断。",
            }
        except Exception as exc:
            logger.warning("病害识别失败：%s", exc)
            return {"status": "error", "code": "inference_error", "message": str(exc)}


plant_disease_service = PlantDiseaseService()
