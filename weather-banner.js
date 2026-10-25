// weather-banner.js - Weather Advisory Banner Logic

class WeatherAdvisoryBanner {
  constructor(options = {}) {
    // 不再硬编码第三方密钥；统一走本地 Flask 气象适配层。
    this.defaultLocation = options.location || "湖北省武汉市";
    this.updateInterval = options.updateInterval || 1800000; // 30 minutes
    this.bannerId = options.bannerId || "weather-advisory-banner";
    this.autoHide = options.autoHide !== false;
    
    this.init();
  }

  async init() {
    await this.fetchWeatherAndDisplay();
    
    // Auto-update every 30 minutes
    setInterval(() => {
      this.fetchWeatherAndDisplay();
    }, this.updateInterval);
  }

  async fetchWeatherAndDisplay() {
    const banner = document.getElementById(this.bannerId);
    if (!banner) {
      console.warn(`Weather banner element #${this.bannerId} not found`);
      return;
    }

    try {
      banner.classList.add('loading');
      
      const weather = await this.fetchWeather(this.defaultLocation);
      this.renderBanner(banner, weather);
      
      banner.classList.remove('loading');
    } catch (error) {
      console.error('Weather banner error:', error);
      banner.classList.remove('loading');
      this.renderError(banner);
    }
  }

  async fetchWeather(location) {
    const response = await fetch(`/api/v1/weather/current?location=${encodeURIComponent(location)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('本地气象接口不可用');
    const payload = await response.json();
    if (payload.status !== 'success' || !payload.data) throw new Error('气象数据格式异常');
    const data = payload.data;
    return {
      isDemo: Boolean(data.is_demo),
      location: { name: data.location, region: data.province || '中国大陆' },
      current: {
        temp_c: Number(data.temperature),
        humidity: Number(data.humidity),
        wind_kph: Number(data.wind_speed),
        is_day: true,
        condition: { text: data.weather_condition },
      },
    };
  }

  generateAdvisory(weatherData) {
    const temp = weatherData.current.temp_c;
    const condition = String(weatherData.current.condition.text || '').toLowerCase();
    const windSpeed = weatherData.current.wind_kph;
    const humidity = weatherData.current.humidity;
    const isDay = weatherData.current.is_day;

    let advisory = { message: '', severity: 'info', icon: 'fa-cloud-sun' };

    // Rain advisory
    if (/雨|rain|drizzle|shower/.test(condition)) {
      advisory = {
        message: '🌧️ 有降雨，建议暂停喷药与叶面施肥，并根据田间积水情况做好排水。',
        severity: 'warning',
        icon: 'fa-cloud-rain'
      };
    }
    // High wind advisory
    else if (windSpeed > 20) {
      advisory = {
        message: '💨 风力较大，建议暂停无人机与喷雾作业，固定好轻质设施。',
        severity: 'warning',
        icon: 'fa-wind'
      };
    }
    // Frost warning
    else if (temp < 5 && !isDay) {
      advisory = {
        message: '❄️ 夜间有霜冻风险，请覆盖敏感作物并检查灌溉设施防冻。',
        severity: 'danger',
        icon: 'fa-snowflake'
      };
    }
    // Extreme heat
    else if (temp > 35) {
      advisory = {
        message: '🔥 高温提醒，建议避开中午田间作业，并根据墒情分次灌溉。',
        severity: 'danger',
        icon: 'fa-temperature-high'
      };
    }
    // Low humidity (drought risk)
    else if (humidity < 30 && temp > 28) {
      advisory = {
        message: '🏜️ 空气干燥，请加强土壤墒情监测，优先采用滴灌或覆盖保墒。',
        severity: 'warning',
        icon: 'fa-droplet-slash'
      };
    }
    // High humidity (disease risk)
    else if (humidity > 80 && temp > 20) {
      advisory = {
        message: '💧 湿度偏高，真菌性病害风险上升，请加强通风并巡查病叶。',
        severity: 'info',
        icon: 'fa-droplet'
      };
    }
    // Thunderstorm
    else if (/雷|thunder|storm/.test(condition)) {
      advisory = {
        message: '⚡ 有雷暴，请停止田间作业，远离高处与金属设施。',
        severity: 'danger',
        icon: 'fa-bolt'
      };
    }
    // Perfect conditions
    else if (temp >= 15 && temp <= 28 && humidity >= 40 && humidity <= 70) {
      advisory = {
        message: '✅ 当前气象条件较适宜田间作业，仍需结合土壤墒情安排。',
        severity: 'success',
        icon: 'fa-check-circle'
      };
    }
    // Default
    else {
      advisory = {
        message: `☁️ 当前天气：${weatherData.current.condition.text}。请结合田间情况安排农事。`,
        severity: 'info',
        icon: 'fa-cloud-sun'
      };
    }

    return advisory;
  }

  renderBanner(banner, weatherData) {
    const advisory = this.generateAdvisory(weatherData);
    const { location, current } = weatherData;

    // Set severity class
    banner.className = `weather-advisory-banner severity-${advisory.severity}`;

    banner.innerHTML = `
      <div class="weather-banner-left">
        <div class="weather-icon">
          <i class="fas ${advisory.icon}"></i>
        </div>
        <div class="weather-info">
          <div class="weather-location">${location.name}${weatherData.isDemo ? ' · 演示' : ''}</div>
          <div class="weather-temp">${Math.round(current.temp_c)}℃</div>
          <div class="weather-condition">${current.condition.text}${weatherData.isDemo ? '（样例）' : ''}</div>
        </div>
      </div>

      <div class="weather-banner-center">
        <div class="advisory-message">
          <span>${advisory.message}</span>
        </div>
      </div>

      <div class="weather-banner-right">
        <div class="weather-stat">
          <i class="fas fa-droplet"></i>
          <span>${current.humidity}%</span>
        </div>
        <div class="weather-stat">
          <i class="fas fa-wind"></i>
          <span>${Math.round(current.wind_kph)} km/h</span>
        </div>
      </div>

      ${this.autoHide ? '<button class="banner-close" aria-label="关闭天气提示"><i class="fas fa-times"></i></button>' : ''}
    `;

    // Add close button handler
    if (this.autoHide) {
      const closeBtn = banner.querySelector('.banner-close');
      closeBtn.addEventListener('click', () => {
        banner.classList.add('hidden');
        // Remember user dismissed it (24 hours)
        sessionStorage.setItem('weather_banner_dismissed', Date.now());
      });
    }
  }

  renderError(banner) {
    banner.className = 'weather-advisory-banner severity-info';
    banner.innerHTML = `
      <div class="weather-banner-left">
        <div class="weather-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="weather-info">
          <div class="weather-temp">气象数据不可用</div>
          <div class="weather-condition">请检查本地服务</div>
        </div>
      </div>
      <div class="weather-banner-center">
        <div class="advisory-message">
          <span>暂时无法获取气象数据，请确认后端服务已启动。</span>
        </div>
      </div>
    `;
  }

  // Public method to update location
  updateLocation(newLocation) {
    this.defaultLocation = newLocation;
    this.fetchWeatherAndDisplay();
  }

  // Public method to show banner again
  show() {
    const banner = document.getElementById(this.bannerId);
    if (banner) {
      banner.classList.remove('hidden');
      sessionStorage.removeItem('weather_banner_dismissed');
    }
  }
}

// Auto-initialize if banner element exists
document.addEventListener('DOMContentLoaded', () => {
  const bannerElement = document.getElementById('weather-advisory-banner');
  
  if (bannerElement) {
    // Check if user dismissed it recently
    const dismissed = sessionStorage.getItem('weather_banner_dismissed');
    const isDismissedRecently = dismissed && (Date.now() - parseInt(dismissed) < 86400000); // 24 hours
    
    if (!isDismissedRecently) {
      // Initialize banner
      window.weatherBanner = new WeatherAdvisoryBanner({
        location: 'Punjab, India', // Change this based on user's location
        updateInterval: 1800000, // Update every 30 minutes
        autoHide: true
      });
    } else {
      bannerElement.classList.add('hidden');
    }
  }
});