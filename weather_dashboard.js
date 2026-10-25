document.addEventListener('DOMContentLoaded', () => {
    // Default location for demo (In real app, fetch from user profile)
    const userLocation = "湖北省武汉市";

    fetchWeather(userLocation);
    fetchAdvisories();
});

async function fetchWeather(location) {
    try {
        const response = await fetch(`/api/v1/weather/current?location=${encodeURIComponent(location)}`);
        const data = await response.json();

        if (data.status === 'success') {
            const w = data.data;
            document.getElementById('current-loc').textContent = w.location;
            document.getElementById('current-temp').textContent = `${Math.round(w.temperature)}℃`;
            document.getElementById('current-cond').textContent = w.weather_condition;
            document.getElementById('humidity-val').textContent = `${w.humidity}%`;
            document.getElementById('wind-val').textContent = `${w.wind_speed} km/h`;
            let sourceNote = document.getElementById('weather-source');
            if (!sourceNote) {
                sourceNote = document.createElement('p');
                sourceNote.id = 'weather-source';
                sourceNote.style.cssText = 'font-size:12px;color:#64748b;margin-top:8px';
                document.querySelector('.weather-info')?.appendChild(sourceNote);
            }
            sourceNote.textContent = w.is_demo ? '本地演示天气 · 非实时气象数据' : `数据来源：${w.source}`;
        }
    } catch (error) {
        console.error('Weather fetch error:', error);
    }
}

async function fetchAdvisories() {
    const list = document.getElementById('advisory-list');

    try {
        const response = await fetch('/api/v1/advisories/');
        const data = await response.json();

        if (data.status === 'success') {
            renderAdvisories(data.data);
        }
    } catch (error) {
        console.error('Advisory fetch error:', error);
        list.innerHTML = '<p>本地建议服务暂时不可用，请确认后端已启动。</p>';
    }
}

function renderAdvisories(advisories) {
    const list = document.getElementById('advisory-list');
    list.innerHTML = '';

    if (advisories.length === 0) {
        list.innerHTML = '<div class="loading-state"><p>暂无农事建议。演示模式不提供基于个人地块的实时建议。</p></div>';
        return;
    }

    advisories.forEach(adv => {
        const card = document.createElement('div');
        card.className = `advisory-card ${String(adv.priority || 'low').toLowerCase()}-priority`;

        card.innerHTML = `
            <span class="priority-badge">${{HIGH:'高',MEDIUM:'中',LOW:'低'}[adv.priority] || adv.priority}</span>
            <div class="crop-label">${adv.crop_name} · ${adv.growth_stage || '生长期'}</div>
            <div class="advisory-text">${formatText(adv.advisory_text)}</div>
            <div class="footer-info">
                <span>生成于 ${formatDate(adv.created_at)}</span>
                <div style="cursor: pointer;" onclick="provideFeedback(${adv.id})">
                    <i class="far fa-star"></i> 反馈
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function formatText(text) {
    // Simple markdown-ish conversion for the demo
    return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit' });
}

async function provideFeedback(id) {
    const { value: rating } = await Swal.fire({
        title: '评价这条建议',
        input: 'range',
        inputLabel: '这条建议是否有帮助？',
        inputAttributes: { min: 1, max: 5, step: 1 },
        inputValue: 5
    });

    if (rating) {
        try {
            await fetch(`/api/v1/advisories/${id}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: parseInt(rating) })
            });
            Swal.fire('谢谢反馈', '演示模式仅记录本次操作，不会进入真实评价系统。', 'success');
        } catch (e) { }
    }
}
