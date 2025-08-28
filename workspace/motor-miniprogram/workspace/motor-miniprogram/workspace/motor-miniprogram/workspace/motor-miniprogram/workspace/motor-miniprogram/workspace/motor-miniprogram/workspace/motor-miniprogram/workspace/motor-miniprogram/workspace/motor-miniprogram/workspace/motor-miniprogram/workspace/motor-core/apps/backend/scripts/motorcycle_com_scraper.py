from typing import Dict, Any, List, Optional
import re
from urllib.parse import urljoin
from datetime import datetime

from scraper_base import BaseScraper, ScrapingConfig
from models import Motorcycle, EngineSpecs, Performance, Dimensions, PriceInfo, Rating, ReviewData

class MotorcycleDotComScraper(BaseScraper):
    """Motorcycle.com网站爬虫"""
    
    def __init__(self, config: Optional[ScrapingConfig] = None):
        super().__init__(config)
        self.base_url = "https://www.motorcycle.com"
        
        # CSS选择器配置（根据Motorcycle.com实际网站结构调整）
        self.selectors = {
            'title': 'h1.title, h1, .bike-title, .motorcycle-name',
            'specifications': '.spec-table, .specifications, .tech-specs, .bike-specs',
            'performance': '.performance-data, .dyno-results, .test-results',
            'price': '.price, .msrp, .starting-price',
            'rating': '.rating-score, .overall-rating, .stars',
            'images': '.hero-image img, .gallery img, .bike-photos img',
            'description': '.bike-description, .overview, .intro-text',
            'review_content': '.review-body, .article-content, .test-content',
            'pros': '.pros-list li, .positives li',
            'cons': '.cons-list li, .negatives li',
            'categories': '.bike-category, .type, .segment'
        }
    
    def scrape_page(self, url: str) -> Optional[Dict[str, Any]]:
        """爬取单个摩托车页面"""
        response = self.get(url)
        if not response:
            return None
        
        soup = self.parse_html(response.text)
        
        # 提取基本信息
        basic_info = self._extract_basic_info(soup, url)
        if not basic_info:
            self.logger.warning(f"无法提取基本信息: {url}")
            return None
        
        # 提取详细规格
        engine_specs = self._extract_engine_specs(soup)
        performance = self._extract_performance(soup)
        dimensions = self._extract_dimensions(soup)
        price = self._extract_price(soup)
        rating = self._extract_rating(soup)
        
        # 提取附加信息
        images = self._extract_images(soup, url)
        description = self._extract_description(soup)
        features = self._extract_features(soup)
        colors = self._extract_colors(soup)
        
        # 构建摩托车对象
        motorcycle = Motorcycle(
            brand=basic_info.get('brand', ''),
            model=basic_info.get('model', ''),
            year=basic_info.get('year', datetime.now().year),
            category=basic_info.get('category'),
            engine=engine_specs,
            performance=performance,
            dimensions=dimensions,
            price=price,
            rating=rating,
            source_url=url,
            images=images,
            description=description,
            features=features,
            colors=colors
        )
        
        return motorcycle.__dict__
    
    def _extract_basic_info(self, soup, url: str) -> Optional[Dict[str, Any]]:
        """提取基本信息"""
        title_elem = soup.select_one(self.selectors['title'])
        if not title_elem:
            self.logger.warning(f"未找到标题元素: {url}")
            return None
        
        title = self.extract_text(title_elem)
        
        # 解析标题获取品牌、型号、年份
        brand, model, year = self._parse_motorcycle_title(title)
        
        # 提取类别信息
        category = self._extract_category(soup)
        
        return {
            'brand': brand,
            'model': model,
            'year': year,
            'category': category
        }
    
    def _parse_motorcycle_title(self, title: str) -> tuple:
        """解析摩托车标题"""
        # 扩展的品牌列表，包括更多摩托车制造商
        brands = [
            'Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'Ducati', 'BMW', 'KTM',
            'Aprilia', 'Triumph', 'Harley-Davidson', 'Indian', 'MV Agusta',
            'Benelli', 'CFMoto', 'Royal Enfield', 'Husqvarna', 'Beta',
            'Sherco', 'GasGas', 'TM Racing', 'Zero', 'Energica', 'Lightning'
        ]
        
        brand = ""
        model = ""
        year = datetime.now().year
        
        # 提取年份
        year_patterns = [
            r'\b(20\d{2})\b',  # 2000-2099
            r'\b(19\d{2})\b',  # 1900-1999
            r"'(\d{2})\b"      # '22, '23 等格式
        ]
        
        for pattern in year_patterns:
            match = re.search(pattern, title)
            if match:
                year_str = match.group(1)
                if len(year_str) == 2:  # 处理 '22 格式
                    year_int = int(year_str)
                    year = 2000 + year_int if year_int < 50 else 1900 + year_int
                else:
                    year = int(year_str)
                break
        
        # 查找品牌
        title_words = title.split()
        for word in title_words:
            for b in brands:
                if word.upper() == b.upper():
                    brand = b
                    break
            if brand:
                break
        
        # 提取型号
        model_text = title
        if brand:
            # 移除品牌名
            model_text = re.sub(rf'\b{re.escape(brand)}\b', '', model_text, flags=re.IGNORECASE)
        
        # 移除年份
        for pattern in year_patterns:
            model_text = re.sub(pattern, '', model_text)
        
        # 清理型号文本
        model = re.sub(r'\s+', ' ', model_text.strip())
        model = re.sub(r'^[^\w]+|[^\w]+$', '', model)  # 移除开头和结尾的非字母数字字符
        
        return brand, model, year
    
    def _extract_category(self, soup) -> Optional[str]:
        """提取摩托车类别"""
        # 首先尝试从专门的类别元素获取
        category_elem = soup.select_one(self.selectors['categories'])
        if category_elem:
            category_text = self.extract_text(category_elem).lower()
            return self._normalize_category(category_text)
        
        # 从页面内容中推断类别
        page_text = soup.get_text().lower()
        return self._infer_category_from_text(page_text)
    
    def _normalize_category(self, category_text: str) -> str:
        """标准化类别名称"""
        category_mapping = {
            'sportbike': 'sport',
            'supersport': 'sport',
            'superbike': 'sport',
            'sport bike': 'sport',
            'street bike': 'naked',
            'streetfighter': 'naked',
            'standard': 'naked',
            'touring bike': 'touring',
            'tourer': 'touring',
            'bagger': 'cruiser',
            'chopper': 'cruiser',
            'dual sport': 'adventure',
            'dual-sport': 'adventure',
            'adv': 'adventure',
            'enduro': 'adventure',
            'motocross': 'dirt',
            'mx': 'dirt',
            'cross': 'dirt',
            'off-road': 'dirt',
            'electric': 'electric',
            'e-bike': 'electric'
        }
        
        for key, value in category_mapping.items():
            if key in category_text:
                return value
        
        return category_text.strip()
    
    def _infer_category_from_text(self, text: str) -> Optional[str]:
        """从文本内容推断类别"""
        category_keywords = {
            'sport': ['supersport', 'sportbike', 'racing', 'track', 'racetrack', 'circuit'],
            'cruiser': ['cruiser', 'touring', 'comfortable', 'highway', 'bagger', 'chopper'],
            'naked': ['naked', 'streetfighter', 'standard', 'upright', 'street'],
            'adventure': ['adventure', 'dual-sport', 'off-road', 'enduro', 'adv', 'travel'],
            'dirt': ['motocross', 'mx', 'dirt', 'off-road', 'enduro', 'trail'],
            'scooter': ['scooter', 'automatic', 'cvt', 'twist-and-go'],
            'electric': ['electric', 'battery', 'zero emissions', 'e-bike']
        }
        
        category_scores = {}
        for category, keywords in category_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                category_scores[category] = score
        
        if category_scores:
            return max(category_scores.items(), key=lambda x: x[1])[0]
        
        return None
    
    def _extract_engine_specs(self, soup) -> Optional[EngineSpecs]:
        """提取发动机规格"""
        specs_section = soup.select_one(self.selectors['specifications'])
        if not specs_section:
            return None
        
        specs_text = specs_section.get_text().lower()
        
        # 更精确的规格提取
        specs = {}
        
        # 排量
        displacement_patterns = [
            r'displacement[:\s]*(\d+(?:\.\d+)?)\s*cc',
            r'engine[:\s]*(\d+(?:\.\d+)?)\s*cc',
            r'(\d+(?:\.\d+)?)\s*cc',
        ]
        displacement = self._extract_with_patterns(specs_text, displacement_patterns)
        
        # 发动机类型
        engine_type_patterns = [
            r'engine type[:\s]*([^\n\r,]+)',
            r'configuration[:\s]*([^\n\r,]+)',
            r'(single|twin|inline-?\d+|v-?\d+|boxer)',
        ]
        engine_type = self._extract_text_with_patterns(specs_text, engine_type_patterns)
        
        # 缸径和行程
        bore_patterns = [r'bore[:\s]*(\d+(?:\.\d+)?)\s*mm']
        stroke_patterns = [r'stroke[:\s]*(\d+(?:\.\d+)?)\s*mm']
        
        bore = self._extract_with_patterns(specs_text, bore_patterns)
        stroke = self._extract_with_patterns(specs_text, stroke_patterns)
        
        # 压缩比
        compression_patterns = [r'compression ratio[:\s]*(\d+(?:\.\d+)?:1)']
        compression = self._extract_text_with_patterns(specs_text, compression_patterns)
        
        # 冷却方式
        cooling_patterns = [
            r'cooling[:\s]*([^\n\r,]+)',
            r'(liquid[- ]?cooled|air[- ]?cooled|oil[- ]?cooled)',
        ]
        cooling = self._extract_text_with_patterns(specs_text, cooling_patterns)
        
        # 燃油系统
        fuel_patterns = [
            r'fuel system[:\s]*([^\n\r,]+)',
            r'(fuel injection|carburetor|efi)',
        ]
        fuel_system = self._extract_text_with_patterns(specs_text, fuel_patterns)
        
        if any([displacement, engine_type, bore, stroke, compression, cooling, fuel_system]):
            return EngineSpecs(
                type=engine_type,
                displacement=displacement,
                bore=bore,
                stroke=stroke,
                compression_ratio=compression,
                cooling=cooling,
                fuel_system=fuel_system
            )
        
        return None
    
    def _extract_performance(self, soup) -> Optional[Performance]:
        """提取性能数据"""
        # 尝试多个可能的性能数据位置
        perf_sections = soup.select(self.selectors['performance']) + soup.select(self.selectors['specifications'])
        
        if not perf_sections:
            return None
        
        perf_text = ' '.join([section.get_text().lower() for section in perf_sections])
        
        # 功率
        power_hp_patterns = [
            r'power[:\s]*(\d+(?:\.\d+)?)\s*hp',
            r'(\d+(?:\.\d+)?)\s*hp',
            r'horsepower[:\s]*(\d+(?:\.\d+)?)',
        ]
        power_kw_patterns = [
            r'power[:\s]*(\d+(?:\.\d+)?)\s*kw',
            r'(\d+(?:\.\d+)?)\s*kw',
        ]
        
        # 扭矩
        torque_nm_patterns = [
            r'torque[:\s]*(\d+(?:\.\d+)?)\s*nm',
            r'(\d+(?:\.\d+)?)\s*nm',
        ]
        torque_lbft_patterns = [
            r'torque[:\s]*(\d+(?:\.\d+)?)\s*lb[- ]?ft',
            r'(\d+(?:\.\d+)?)\s*lb[- ]?ft',
        ]
        
        # 最高速度
        top_speed_patterns = [
            r'top speed[:\s]*(\d+(?:\.\d+)?)\s*mph',
            r'max speed[:\s]*(\d+(?:\.\d+)?)\s*mph',
            r'(\d+(?:\.\d+)?)\s*mph',
        ]
        
        # 加速
        acceleration_patterns = [
            r'0[- ]?60[:\s]*(\d+(?:\.\d+)?)\s*sec',
            r'0[- ]?to[- ]?60[:\s]*(\d+(?:\.\d+)?)\s*sec',
        ]
        
        # 四分之一英里
        quarter_mile_patterns = [
            r'quarter mile[:\s]*(\d+(?:\.\d+)?)\s*sec',
            r'1/4 mile[:\s]*(\d+(?:\.\d+)?)\s*sec',
        ]
        
        power_hp = self._extract_with_patterns(perf_text, power_hp_patterns)
        power_kw = self._extract_with_patterns(perf_text, power_kw_patterns)
        torque_nm = self._extract_with_patterns(perf_text, torque_nm_patterns)
        torque_lbft = self._extract_with_patterns(perf_text, torque_lbft_patterns)
        top_speed = self._extract_with_patterns(perf_text, top_speed_patterns)
        acceleration = self._extract_with_patterns(perf_text, acceleration_patterns)
        quarter_mile = self._extract_with_patterns(perf_text, quarter_mile_patterns)
        
        if any([power_hp, power_kw, torque_nm, torque_lbft, top_speed, acceleration, quarter_mile]):
            return Performance(
                power_hp=power_hp,
                power_kw=power_kw,
                torque_nm=torque_nm,
                torque_lbft=torque_lbft,
                top_speed_mph=top_speed,
                acceleration_0_60=acceleration,
                quarter_mile=quarter_mile
            )
        
        return None
    
    def _extract_dimensions(self, soup) -> Optional[Dimensions]:
        """提取尺寸数据"""
        specs_section = soup.select_one(self.selectors['specifications'])
        if not specs_section:
            return None
        
        specs_text = specs_section.get_text().lower()
        
        # 尺寸数据提取模式
        dimension_patterns = {
            'length': [r'length[:\s]*(\d+(?:\.\d+)?)\s*mm', r'length[:\s]*(\d+(?:\.\d+)?)\s*in'],
            'width': [r'width[:\s]*(\d+(?:\.\d+)?)\s*mm', r'width[:\s]*(\d+(?:\.\d+)?)\s*in'],
            'height': [r'height[:\s]*(\d+(?:\.\d+)?)\s*mm', r'height[:\s]*(\d+(?:\.\d+)?)\s*in'],
            'wheelbase': [r'wheelbase[:\s]*(\d+(?:\.\d+)?)\s*mm', r'wheelbase[:\s]*(\d+(?:\.\d+)?)\s*in'],
            'ground_clearance': [r'ground clearance[:\s]*(\d+(?:\.\d+)?)\s*mm'],
            'seat_height': [r'seat height[:\s]*(\d+(?:\.\d+)?)\s*mm', r'seat height[:\s]*(\d+(?:\.\d+)?)\s*in'],
            'dry_weight': [r'dry weight[:\s]*(\d+(?:\.\d+)?)\s*kg', r'dry weight[:\s]*(\d+(?:\.\d+)?)\s*lb'],
            'wet_weight': [r'wet weight[:\s]*(\d+(?:\.\d+)?)\s*kg', r'weight[:\s]*(\d+(?:\.\d+)?)\s*kg'],
            'fuel_capacity': [r'fuel capacity[:\s]*(\d+(?:\.\d+)?)\s*l', r'tank[:\s]*(\d+(?:\.\d+)?)\s*gal']
        }
        
        dimensions = {}
        for key, patterns in dimension_patterns.items():
            value = self._extract_with_patterns(specs_text, patterns)
            if value:
                dimensions[key] = value
        
        if dimensions:
            return Dimensions(**dimensions)
        
        return None
    
    def _extract_price(self, soup) -> Optional[PriceInfo]:
        """提取价格信息"""
        price_elem = soup.select_one(self.selectors['price'])
        if not price_elem:
            # 尝试在页面中查找价格
            price_text = soup.get_text()
            price_match = re.search(r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', price_text)
            if price_match:
                price_str = price_match.group(1).replace(',', '')
                price_value = float(price_str)
            else:
                return None
        else:
            price_text = self.extract_text(price_elem)
            price_value = self.extract_number(price_text.replace('$', '').replace(',', ''))
        
        if price_value and price_value > 1000:  # 合理的价格范围
            return PriceInfo(
                msrp=price_value,
                currency="USD",
                year=datetime.now().year
            )
        
        return None
    
    def _extract_rating(self, soup) -> Optional[Rating]:
        """提取评分"""
        rating_elem = soup.select_one(self.selectors['rating'])
        if not rating_elem:
            return None
        
        rating_text = self.extract_text(rating_elem)
        
        # 尝试提取评分数字
        rating_patterns = [
            r'(\d+(?:\.\d+)?)/10',
            r'(\d+(?:\.\d+)?)/5',
            r'(\d+(?:\.\d+?))\s*stars?',
            r'rating[:\s]*(\d+(?:\.\d+)?)',
        ]
        
        for pattern in rating_patterns:
            match = re.search(pattern, rating_text.lower())
            if match:
                score = float(match.group(1))
                # 根据评分系统确定满分
                if '/5' in pattern or 'stars' in pattern:
                    scale = 5
                else:
                    scale = 10
                
                return Rating(overall=score, scale=scale)
        
        return None
    
    def _extract_images(self, soup, base_url: str) -> List[str]:
        """提取图片URL"""
        images = []
        img_elements = soup.select(self.selectors['images'])
        
        for img in img_elements[:15]:  # 限制最多15张图片
            src = img.get('src') or img.get('data-src') or img.get('data-original')
            if src:
                # 跳过小图标和占位符
                if any(skip in src.lower() for skip in ['icon', 'logo', 'placeholder', 'thumbnail']):
                    continue
                
                full_url = urljoin(base_url, src)
                if self.is_valid_url(full_url) and full_url not in images:
                    images.append(full_url)
        
        return images
    
    def _extract_description(self, soup) -> Optional[str]:
        """提取描述"""
        desc_elem = soup.select_one(self.selectors['description'])
        if desc_elem:
            description = self.extract_text(desc_elem)
            # 限制描述长度
            if len(description) > 2000:
                description = description[:2000] + "..."
            return description
        return None
    
    def _extract_features(self, soup) -> List[str]:
        """提取特色功能"""
        features = []
        
        # 查找功能列表
        feature_selectors = [
            '.features li',
            '.highlights li',
            '.key-features li',
            '.equipment li',
            'ul li'
        ]
        
        for selector in feature_selectors:
            elements = soup.select(selector)
            for elem in elements:
                text = self.extract_text(elem)
                if text and 10 <= len(text) <= 150:  # 合理的功能描述长度
                    features.append(text)
                    if len(features) >= 15:  # 限制功能数量
                        break
            if len(features) >= 15:
                break
        
        return list(set(features))  # 去重
    
    def _extract_colors(self, soup) -> List[str]:
        """提取可选颜色"""
        colors = []
        
        # 查找颜色信息
        color_selectors = [
            '.colors li',
            '.available-colors li',
            '.color-options li',
            '[data-color]'
        ]
        
        for selector in color_selectors:
            elements = soup.select(selector)
            for elem in elements:
                color = self.extract_text(elem) or elem.get('data-color')
                if color and len(color) < 50:
                    colors.append(color)
        
        return colors[:10]  # 限制颜色数量
    
    def _extract_with_patterns(self, text: str, patterns: List[str]) -> Optional[float]:
        """使用多个模式提取数值"""
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1))
                except (ValueError, IndexError):
                    continue
        return None
    
    def _extract_text_with_patterns(self, text: str, patterns: List[str]) -> Optional[str]:
        """使用多个模式提取文本"""
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                result = match.group(1).strip()
                if result:
                    return result
        return None
    
    def get_bike_listing_urls(self) -> List[str]:
        """获取摩托车列表页面URL"""
        urls = [
            f"{self.base_url}/reviews",
            f"{self.base_url}/bikes",
            f"{self.base_url}/motorcycles",
            f"{self.base_url}/new-motorcycles",
            f"{self.base_url}/categories/sportbikes",
            f"{self.base_url}/categories/cruisers",
            f"{self.base_url}/categories/touring",
            f"{self.base_url}/categories/adventure",
        ]
        return urls
    
    def extract_bike_urls_from_listing(self, listing_url: str) -> List[str]:
        """从列表页面提取摩托车详情页URL"""
        response = self.get(listing_url)
        if not response:
            return []
        
        soup = self.parse_html(response.text)
        urls = []
        
        # 查找摩托车详情页链接
        link_patterns = [
            'a[href*="/review/"]',
            'a[href*="/motorcycle/"]',
            'a[href*="/bike/"]',
            'a[href*="/test/"]',
            '.bike-card a',
            '.motorcycle-card a',
            '.review-card a'
        ]
        
        for pattern in link_patterns:
            links = soup.select(pattern)
            for link in links:
                href = link.get('href')
                if href:
                    full_url = urljoin(listing_url, href)
                    if self.is_valid_url(full_url) and full_url not in urls:
                        # 过滤掉非摩托车页面
                        if any(keyword in full_url.lower() for keyword in ['/review/', '/motorcycle/', '/bike/', '/test/']):
                            urls.append(full_url)
        
        return urls