import torch
import torch.nn as nn
import os
import logging

logger = logging.getLogger(__name__)

class PlantDiseaseNet(nn.Module):
    """与训练 notebook（plant-disease-cnn-1 (1).ipynb）中的 CNN_NeuralNet 完全一致。

    关键点：ConvBlock 的 pool 是 MaxPool2d(4)，分类头是 MaxPool2d(4)+Flatten+Linear(512,38)。
    此前的自适应池化结构与权重不匹配，strict=False 静默加载后输出无效结果。
    """

    def __init__(self, num_classes=38):  # original model had 38 classes
        super(PlantDiseaseNet, self).__init__()

        def conv_block(in_channels, out_channels, pool=False):
            layers = [
                nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True),
            ]
            if pool:
                layers.append(nn.MaxPool2d(4))
            return nn.Sequential(*layers)

        self.conv1 = conv_block(3, 64)
        self.conv2 = conv_block(64, 128, pool=True)
        self.res1 = nn.Sequential(conv_block(128, 128), conv_block(128, 128))
        self.conv3 = conv_block(128, 256, pool=True)
        self.conv4 = conv_block(256, 512, pool=True)
        self.res2 = nn.Sequential(conv_block(512, 512), conv_block(512, 512))
        self.classifier = nn.Sequential(
            nn.MaxPool2d(4),
            nn.Flatten(),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        x = self.conv1(x)
        x = self.conv2(x)
        x = self.res1(x) + x
        x = self.conv3(x)
        x = self.conv4(x)
        x = self.res2(x) + x
        return self.classifier(x)

def load_pytorch_model(model_path, device='cpu'):
    try:
        if not os.path.exists(model_path):
            logger.error(f"PyTorch model file missing: {model_path}")
            return None
        # Safe loading with torch.load
        model = torch.load(model_path, map_location=device)
        # If it was saved as state dict rather than full model
        if isinstance(model, dict):
            net = PlantDiseaseNet()
            net.load_state_dict(model)
            model = net
        model.eval()
        return model
    except Exception as e:
        logger.error(f"Error loading PyTorch model from {model_path}: {str(e)}")
        return None

def predict_pytorch(model, input_tensor):
    if model is None:
        logger.error("Prediction failed: PyTorch model is not loaded (None)")
        return None
    try:
        with torch.no_grad():
            output = model(input_tensor)
            return output
    except Exception as e:
        logger.error(f"Error predicting with PyTorch model: {str(e)}")
        return None

