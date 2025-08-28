from typing import Dict, Any, List, Optional
import re
from urllib.parse import urljoin
from datetime import datetime

from scraper_base import BaseScraper, ScrapingConfig
from models import Motorcycle, EngineSpecs, Performance, Dimensions, PriceInfo, Rating, ReviewData

class CycleWorldScraper(BaseScraper):
    """CycleWorld网站爬虫"""
    
    def __init__(self, config: Optional[ScrapingConfig] = None):
        super().__init__(config)
        self.base_url = "https://www.cycleworld.com"
        
        # CSS选择器配置（根据实际网站结构调整）
        self.selectors = {
            'title': 'h1, .title, .motorcycle-title',
            'specifications': '.specifications, .specs, .spec-table',
            'performance': '.performance, .perf-data',
            'price': '.price, .msrp',
            'rating': '.rating, .score',
            'images': 'img[src*="motorcycle"], .gallery img',
            'description': '.description, .summary, .intro',
            'review_content': '.review-content, .article-content',
            'pros': '.pros li, .advantages li',
            'cons': '.cons li, .disadvantages li'
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
            features=features
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
        brand, model, year = self._parse_title(title)
        
        # 尝试从URL或页面内容中提取更多信息
        category = self._extract_category(soup)
        
        return {
            'brand': brand,
            'model': model,
            'year': year,
            'category': category
        }
    
    def _parse_title(self, title: str) -> tuple:
        """解析标题获取品牌、型号、年份"""
        # 常见摩托车品牌
        brands = ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'Ducati', 'BMW', 'KTM', 
                 'Aprilia', 'Triumph', 'Harley-Davidson', 'Indian', 'MV Agusta']
        
        brand = ""
        model = ""
        year = datetime.now().year
        
        # 查找年份（4位数字）
        year_match = re.search(r'\b(20\d{2})\b', title)
        if year_match:
            year = int(year_match.group(1))
        
        # 查找品牌
        title_upper = title.upper()
        for b in brands:
            if b.upper() in title_upper:
                brand = b
                break
        
        # 提取型号（去除品牌和年份后的剩余部分）
        model_text = title
        if brand:
            model_text = re.sub(rf'\b{re.escape(brand)}\b', '', model_text, flags=re.IGNORECASE)
        if year_match:
            model_text = re.sub(rf'\b{year_match.group(1)}\b', '', model_text)
        
        model = re.sub(r'\s+', ' ', model_text.strip())
        
        return brand, model, year
    
    def _extract_category(self, soup) -> Optional[str]:
        """提取车型类别"""
        # 常见类别关键词
        categories = {
            'sport': ['sport', 'supersport', 'sportbike', 'racing'],
            'cruiser': ['cruiser', 'touring', 'bagger'],
            'naked': ['naked', 'streetfighter', 'standard'],
            'adventure': ['adventure', 'adv', 'dual-sport', 'enduro'],
            'dirt': ['dirt', 'motocross', 'mx', 'off-road'],
            'scooter': ['scooter', 'automatic']
        }
        
        # 在页面文本中查找类别关键词
        page_text = soup.get_text().lower()
        
        for category, keywords in categories.items():
            if any(keyword in page_text for keyword in keywords):
                return category
        
        return None
    
    def _extract_engine_specs(self, soup) -> Optional[EngineSpecs]:
        """提取发动机规格"""
        specs_section = soup.select_one(self.selectors['specifications'])
        if not specs_section:
            return None
        
        specs_text = specs_section.get_text().lower()
        
        # 提取各种规格数据
        displacement = self._find_spec_value(specs_text, ['displacement', 'cc', 'engine'], 'cc')
        bore = self._find_spec_value(specs_text, ['bore'], 'mm')
        stroke = self._find_spec_value(specs_text, ['stroke'], 'mm')
        compression = self._find_spec_text(specs_text, ['compression ratio', 'compression'])
        cooling = self._find_spec_text(specs_text, ['cooling', 'cooled'])
        fuel_system = self._find_spec_text(specs_text, ['fuel injection', 'carburetor', 'fuel'])
        engine_type = self._find_spec_text(specs_text, ['engine type', 'configuration'])
        
        if any([displacement, bore, stroke, compression, cooling, fuel_system, engine_type]):
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
        perf_section = soup.select_one(self.selectors['performance'])
        if not perf_section:
            # 尝试在规格表中查找性能数据
            perf_section = soup.select_one(self.selectors['specifications'])
        
        if not perf_section:
            return None
        
        perf_text = perf_section.get_text().lower()
        
        # 提取性能数据
        power_hp = self._find_spec_value(perf_text, ['horsepower', 'hp', 'power'], 'hp')
        power_kw = self._find_spec_value(perf_text, ['kilowatt', 'kw'], 'kw')
        torque_nm = self._find_spec_value(perf_text, ['torque', 'nm'], 'nm')
        torque_lbft = self._find_spec_value(perf_text, ['lb-ft', 'lbft', 'ft-lb'], 'lb-ft')
        top_speed_mph = self._find_spec_value(perf_text, ['top speed', 'max speed'], 'mph')
        acceleration = self._find_spec_value(perf_text, ['0-60', '0 to 60', 'acceleration'], 'sec')
        quarter_mile = self._find_spec_value(perf_text, ['quarter mile', '1/4 mile'], 'sec')
        
        if any([power_hp, power_kw, torque_nm, torque_lbft, top_speed_mph, acceleration, quarter_mile]):
            return Performance(
                power_hp=power_hp,
                power_kw=power_kw,
                torque_nm=torque_nm,
                torque_lbft=torque_lbft,
                top_speed_mph=top_speed_mph,
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
        
        # 提取尺寸数据
        length = self._find_spec_value(specs_text, ['length'], 'mm')
        width = self._find_spec_value(specs_text, ['width'], 'mm')
        height = self._find_spec_value(specs_text, ['height'], 'mm')
        wheelbase = self._find_spec_value(specs_text, ['wheelbase'], 'mm')
        ground_clearance = self._find_spec_value(specs_text, ['ground clearance', 'clearance'], 'mm')
        seat_height = self._find_spec_value(specs_text, ['seat height'], 'mm')
        dry_weight = self._find_spec_value(specs_text, ['dry weight', 'curb weight'], 'kg')
        wet_weight = self._find_spec_value(specs_text, ['wet weight', 'weight'], 'kg')
        fuel_capacity = self._find_spec_value(specs_text, ['fuel capacity', 'tank'], 'l')
        
        if any([length, width, height, wheelbase, ground_clearance, seat_height, dry_weight, wet_weight, fuel_capacity]):
            return Dimensions(
                length=length,
                width=width,
                height=height,
                wheelbase=wheelbase,
                ground_clearance=ground_clearance,
                seat_height=seat_height,
                dry_weight=dry_weight,
                wet_weight=wet_weight,
                fuel_capacity=fuel_capacity
            )
        
        return None
    
    def _extract_price(self, soup) -> Optional[PriceInfo]:
        """提取价格信息"""
        price_elem = soup.select_one(self.selectors['price'])
        if not price_elem:
            return None
        
        price_text = self.extract_text(price_elem)
        price_value = self.extract_number(price_text.replace('$', '').replace(',', ''))
        
        if price_value:
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
        
        rating_text = rating_elem.get_text()
        overall = self.extract_number(rating_text)
        
        if overall:
            return Rating(overall=overall)
        
        return None
    
    def _extract_images(self, soup, base_url: str) -> List[str]:
        """提取图片URL"""
        images = []
        img_elements = soup.select(self.selectors['images'])
        
        for img in img_elements[:10]:  # 限制最多10张图片
            src = img.get('src') or img.get('data-src')
            if src:
                full_url = urljoin(base_url, src)
                if self.is_valid_url(full_url):
                    images.append(full_url)
        
        return images
    
    def _extract_description(self, soup) -> Optional[str]:
        """提取描述"""
        desc_elem = soup.select_one(self.selectors['description'])
        if desc_elem:
            return self.extract_text(desc_elem)
        return None
    
    def _extract_features(self, soup) -> List[str]:
        """提取特色功能"""
        features = []
        
        # 查找功能列表
        feature_elements = soup.select('.features li, .highlights li, ul li')
        for elem in feature_elements:
            text = self.extract_text(elem)
            if text and len(text) > 5 and len(text) < 100:
                features.append(text)
        
        return features[:10]  # 限制最多10个功能
    
    def _find_spec_value(self, text: str, keywords: List[str], unit: str = '') -> Optional[float]:
        """在文本中查找规格数值"""
        for keyword in keywords:
            pattern = rf'{keyword}[:\s]*(\d+[\.\d]*)\s*{unit}'
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1))
        return None
    
    def _find_spec_text(self, text: str, keywords: List[str]) -> Optional[str]:
        """在文本中查找规格文本"""
        for keyword in keywords:
            pattern = rf'{keyword}[:\s]*([^\n\r]+)'
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
    
    def get_motorcycle_list_urls(self, category: str = None) -> List[str]:
        """获取摩托车列表页面的URL"""
        urls = []
        
        # 根据类别构建URL（需要根据实际网站结构调整）
        base_paths = [
            '/reviews',
            '/motorcycles',
            '/bikes'
        ]
        
        for path in base_paths:
            if category:
                url = f"{self.base_url}{path}/{category}"
            else:
                url = f"{self.base_url}{path}"
            urls.append(url)
        
        return urls
    
    def extract_motorcycle_urls_from_listing(self, listing_url: str) -> List[str]:
        """从列表页面提取摩托车详情页URL"""
        response = self.get(listing_url)
        if not response:
            return []
        
        soup = self.parse_html(response.text)
        urls = []
        
        # 查找摩托车链接（需要根据实际网站结构调整）
        link_selectors = [
            'a[href*="/review"]',
            'a[href*="/motorcycle"]',
            'a[href*="/bike"]',
            '.motorcycle-card a',
            '.bike-card a'
        ]
        
        for selector in link_selectors:
            links = soup.select(selector)
            for link in links:
                href = link.get('href')
                if href:
                    full_url = urljoin(listing_url, href)
                    if self.is_valid_url(full_url) and full_url not in urls:
                        urls.append(full_url)
        
        return urls