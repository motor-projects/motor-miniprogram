import json
import csv
import sqlite3
import os
import hashlib
from typing import Dict, Any, List, Optional, Set
from datetime import datetime
from pathlib import Path
import pandas as pd
from dataclasses import asdict

from models import Motorcycle, EngineSpecs, Performance, Dimensions, PriceInfo, Rating

class DataCleaner:
    """数据清理器"""
    
    @staticmethod
    def clean_motorcycle_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """清理摩托车数据"""
        cleaned = {}
        
        # 清理基本信息
        cleaned['brand'] = DataCleaner._clean_text(data.get('brand', ''))
        cleaned['model'] = DataCleaner._clean_text(data.get('model', ''))
        cleaned['year'] = DataCleaner._clean_year(data.get('year'))
        cleaned['category'] = DataCleaner._clean_category(data.get('category'))
        
        # 清理规格数据
        if data.get('engine'):
            cleaned['engine'] = DataCleaner._clean_engine_specs(data['engine'])
        
        if data.get('performance'):
            cleaned['performance'] = DataCleaner._clean_performance(data['performance'])
        
        if data.get('dimensions'):
            cleaned['dimensions'] = DataCleaner._clean_dimensions(data['dimensions'])
        
        if data.get('price'):
            cleaned['price'] = DataCleaner._clean_price(data['price'])
        
        if data.get('rating'):
            cleaned['rating'] = DataCleaner._clean_rating(data['rating'])
        
        # 清理附加信息
        cleaned['source_url'] = data.get('source_url', '')
        cleaned['scraped_at'] = data.get('scraped_at')
        cleaned['updated_at'] = data.get('updated_at')
        cleaned['images'] = DataCleaner._clean_image_urls(data.get('images', []))
        cleaned['description'] = DataCleaner._clean_text(data.get('description', ''))
        cleaned['features'] = DataCleaner._clean_features(data.get('features', []))
        cleaned['colors'] = DataCleaner._clean_colors(data.get('colors', []))
        
        return cleaned
    
    @staticmethod
    def _clean_text(text: str) -> str:
        """清理文本数据"""
        if not text or not isinstance(text, str):
            return ""
        
        # 移除多余空白字符
        text = ' '.join(text.split())
        
        # 移除特殊字符（保留基本标点）
        import re
        text = re.sub(r'[^\w\s\-\(\)\.,;:!?\'"\/]', '', text)
        
        return text.strip()
    
    @staticmethod
    def _clean_year(year: Any) -> int:
        """清理年份数据"""
        current_year = datetime.now().year
        
        if isinstance(year, (int, float)):
            year_int = int(year)
            if 1900 <= year_int <= current_year + 2:
                return year_int
        
        if isinstance(year, str):
            import re
            year_match = re.search(r'\b(19\d{2}|20\d{2})\b', year)
            if year_match:
                year_int = int(year_match.group(1))
                if 1900 <= year_int <= current_year + 2:
                    return year_int
        
        return current_year
    
    @staticmethod
    def _clean_category(category: Any) -> Optional[str]:
        """清理类别数据"""
        if not category:
            return None
        
        if isinstance(category, str):
            category = category.lower().strip()
            
            # 标准化类别名称
            category_map = {
                'sportbike': 'sport',
                'supersport': 'sport',
                'superbike': 'sport',
                'streetfighter': 'naked',
                'standard': 'naked',
                'dual-sport': 'adventure',
                'dual sport': 'adventure',
                'adv': 'adventure',
                'motocross': 'dirt',
                'mx': 'dirt',
                'off-road': 'dirt',
                'electric': 'electric',
                'e-bike': 'electric'
            }
            
            return category_map.get(category, category)
        
        return None
    
    @staticmethod
    def _clean_engine_specs(engine_data: Dict[str, Any]) -> Dict[str, Any]:
        """清理发动机规格数据"""
        cleaned = {}
        
        # 清理排量
        if engine_data.get('displacement'):
            displacement = DataCleaner._clean_number(engine_data['displacement'])
            if displacement and 50 <= displacement <= 2500:  # 合理的排量范围
                cleaned['displacement'] = displacement
        
        # 清理缸径和行程
        for field in ['bore', 'stroke']:
            if engine_data.get(field):
                value = DataCleaner._clean_number(engine_data[field])
                if value and 20 <= value <= 120:  # 合理的缸径/行程范围
                    cleaned[field] = value
        
        # 清理文本字段
        for field in ['type', 'compression_ratio', 'cooling', 'fuel_system']:
            if engine_data.get(field):
                cleaned[field] = DataCleaner._clean_text(str(engine_data[field]))
        
        return cleaned
    
    @staticmethod
    def _clean_performance(perf_data: Dict[str, Any]) -> Dict[str, Any]:
        """清理性能数据"""
        cleaned = {}
        
        # 功率数据
        if perf_data.get('power_hp'):
            hp = DataCleaner._clean_number(perf_data['power_hp'])
            if hp and 5 <= hp <= 300:  # 合理的功率范围
                cleaned['power_hp'] = hp
        
        if perf_data.get('power_kw'):
            kw = DataCleaner._clean_number(perf_data['power_kw'])
            if kw and 3 <= kw <= 250:
                cleaned['power_kw'] = kw
        
        # 扭矩数据
        if perf_data.get('torque_nm'):
            nm = DataCleaner._clean_number(perf_data['torque_nm'])
            if nm and 5 <= nm <= 250:
                cleaned['torque_nm'] = nm
        
        if perf_data.get('torque_lbft'):
            lbft = DataCleaner._clean_number(perf_data['torque_lbft'])
            if lbft and 5 <= lbft <= 200:
                cleaned['torque_lbft'] = lbft
        
        # 速度数据
        if perf_data.get('top_speed_mph'):
            speed = DataCleaner._clean_number(perf_data['top_speed_mph'])
            if speed and 30 <= speed <= 250:
                cleaned['top_speed_mph'] = speed
        
        if perf_data.get('top_speed_kmh'):
            speed = DataCleaner._clean_number(perf_data['top_speed_kmh'])
            if speed and 50 <= speed <= 400:
                cleaned['top_speed_kmh'] = speed
        
        # 加速数据
        if perf_data.get('acceleration_0_60'):
            accel = DataCleaner._clean_number(perf_data['acceleration_0_60'])
            if accel and 1 <= accel <= 15:
                cleaned['acceleration_0_60'] = accel
        
        if perf_data.get('quarter_mile'):
            qm = DataCleaner._clean_number(perf_data['quarter_mile'])
            if qm and 8 <= qm <= 20:
                cleaned['quarter_mile'] = qm
        
        return cleaned
    
    @staticmethod
    def _clean_dimensions(dim_data: Dict[str, Any]) -> Dict[str, Any]:
        """清理尺寸数据"""
        cleaned = {}
        
        # 尺寸范围验证
        ranges = {
            'length': (1500, 3000),      # mm
            'width': (600, 1200),        # mm
            'height': (800, 1800),       # mm
            'wheelbase': (1200, 2000),   # mm
            'ground_clearance': (100, 300), # mm
            'seat_height': (600, 900),   # mm
            'dry_weight': (80, 400),     # kg
            'wet_weight': (90, 450),     # kg
            'fuel_capacity': (5, 30)     # L
        }
        
        for field, (min_val, max_val) in ranges.items():
            if dim_data.get(field):
                value = DataCleaner._clean_number(dim_data[field])
                if value and min_val <= value <= max_val:
                    cleaned[field] = value
        
        return cleaned
    
    @staticmethod
    def _clean_price(price_data: Dict[str, Any]) -> Dict[str, Any]:
        """清理价格数据"""
        cleaned = {}
        
        if price_data.get('msrp'):
            price = DataCleaner._clean_number(price_data['msrp'])
            if price and 1000 <= price <= 100000:  # 合理的价格范围
                cleaned['msrp'] = price
        
        if price_data.get('currency'):
            cleaned['currency'] = DataCleaner._clean_text(str(price_data['currency']))
        
        if price_data.get('year'):
            cleaned['year'] = DataCleaner._clean_year(price_data['year'])
        
        return cleaned
    
    @staticmethod
    def _clean_rating(rating_data: Dict[str, Any]) -> Dict[str, Any]:
        """清理评分数据"""
        cleaned = {}
        
        scale = rating_data.get('scale', 10)
        if isinstance(scale, (int, float)) and scale > 0:
            cleaned['scale'] = int(scale)
        else:
            scale = 10  # 默认满分
        
        for field in ['overall', 'performance', 'comfort', 'build_quality', 'value']:
            if rating_data.get(field):
                rating = DataCleaner._clean_number(rating_data[field])
                if rating and 0 <= rating <= scale:
                    cleaned[field] = rating
        
        return cleaned
    
    @staticmethod
    def _clean_number(value: Any) -> Optional[float]:
        """清理数字数据"""
        if value is None:
            return None
        
        if isinstance(value, (int, float)):
            return float(value)
        
        if isinstance(value, str):
            import re
            # 移除货币符号和逗号
            value = re.sub(r'[$,\s]', '', value)
            
            # 查找数字
            number_match = re.search(r'(\d+(?:\.\d+)?)', value)
            if number_match:
                try:
                    return float(number_match.group(1))
                except ValueError:
                    pass
        
        return None
    
    @staticmethod
    def _clean_image_urls(urls: List[str]) -> List[str]:
        """清理图片URL列表"""
        cleaned_urls = []
        
        for url in urls:
            if isinstance(url, str) and url.strip():
                cleaned_url = url.strip()
                # 验证URL格式
                if (cleaned_url.startswith(('http://', 'https://')) and 
                    any(ext in cleaned_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp'])):
                    cleaned_urls.append(cleaned_url)
        
        return list(set(cleaned_urls))  # 去重
    
    @staticmethod
    def _clean_features(features: List[str]) -> List[str]:
        """清理功能特色列表"""
        cleaned_features = []
        
        for feature in features:
            if isinstance(feature, str) and feature.strip():
                cleaned_feature = DataCleaner._clean_text(feature)
                if 5 <= len(cleaned_feature) <= 200:  # 合理的功能描述长度
                    cleaned_features.append(cleaned_feature)
        
        return list(set(cleaned_features))  # 去重
    
    @staticmethod
    def _clean_colors(colors: List[str]) -> List[str]:
        """清理颜色列表"""
        cleaned_colors = []
        
        for color in colors:
            if isinstance(color, str) and color.strip():
                cleaned_color = DataCleaner._clean_text(color)
                if 2 <= len(cleaned_color) <= 50:  # 合理的颜色名称长度
                    cleaned_colors.append(cleaned_color)
        
        return list(set(cleaned_colors))  # 去重

class DataStorage:
    """数据存储管理器"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # 创建子目录
        (self.data_dir / "json").mkdir(exist_ok=True)
        (self.data_dir / "csv").mkdir(exist_ok=True)
        (self.data_dir / "sqlite").mkdir(exist_ok=True)
        
        self.db_path = self.data_dir / "sqlite" / "motorcycles.db"
        self.init_database()
    
    def init_database(self):
        """初始化SQLite数据库"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 创建主表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS motorcycles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    data_hash TEXT UNIQUE,
                    brand TEXT NOT NULL,
                    model TEXT NOT NULL,
                    year INTEGER NOT NULL,
                    category TEXT,
                    source_url TEXT,
                    scraped_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    raw_data TEXT,
                    UNIQUE(brand, model, year)
                )
            """)
            
            # 创建发动机规格表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS engine_specs (
                    motorcycle_id INTEGER,
                    type TEXT,
                    displacement REAL,
                    bore REAL,
                    stroke REAL,
                    compression_ratio TEXT,
                    cooling TEXT,
                    fuel_system TEXT,
                    FOREIGN KEY (motorcycle_id) REFERENCES motorcycles (id)
                )
            """)
            
            # 创建性能数据表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS performance (
                    motorcycle_id INTEGER,
                    power_hp REAL,
                    power_kw REAL,
                    torque_nm REAL,
                    torque_lbft REAL,
                    top_speed_mph REAL,
                    top_speed_kmh REAL,
                    acceleration_0_60 REAL,
                    quarter_mile REAL,
                    FOREIGN KEY (motorcycle_id) REFERENCES motorcycles (id)
                )
            """)
            
            # 创建尺寸表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS dimensions (
                    motorcycle_id INTEGER,
                    length REAL,
                    width REAL,
                    height REAL,
                    wheelbase REAL,
                    ground_clearance REAL,
                    seat_height REAL,
                    dry_weight REAL,
                    wet_weight REAL,
                    fuel_capacity REAL,
                    FOREIGN KEY (motorcycle_id) REFERENCES motorcycles (id)
                )
            """)
            
            # 创建索引
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_brand_model ON motorcycles (brand, model)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_year ON motorcycles (year)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_category ON motorcycles (category)")
            
            conn.commit()
    
    def generate_data_hash(self, data: Dict[str, Any]) -> str:
        """生成数据哈希值用于去重"""
        # 创建用于哈希的关键字段
        key_fields = {
            'brand': data.get('brand', ''),
            'model': data.get('model', ''),
            'year': data.get('year', 0),
            'source_url': data.get('source_url', '')
        }
        
        key_string = json.dumps(key_fields, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def save_motorcycle(self, data: Dict[str, Any]) -> bool:
        """保存摩托车数据到数据库"""
        try:
            # 清理数据
            cleaned_data = DataCleaner.clean_motorcycle_data(data)
            data_hash = self.generate_data_hash(cleaned_data)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 检查是否已存在
                cursor.execute("SELECT id FROM motorcycles WHERE data_hash = ?", (data_hash,))
                existing = cursor.fetchone()
                
                if existing:
                    # 更新现有记录
                    motorcycle_id = existing[0]
                    cursor.execute("""
                        UPDATE motorcycles 
                        SET updated_at = CURRENT_TIMESTAMP, raw_data = ?
                        WHERE id = ?
                    """, (json.dumps(cleaned_data), motorcycle_id))
                else:
                    # 插入新记录
                    cursor.execute("""
                        INSERT INTO motorcycles (
                            data_hash, brand, model, year, category, 
                            source_url, scraped_at, updated_at, raw_data
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
                    """, (
                        data_hash,
                        cleaned_data.get('brand', ''),
                        cleaned_data.get('model', ''),
                        cleaned_data.get('year', 0),
                        cleaned_data.get('category'),
                        cleaned_data.get('source_url', ''),
                        cleaned_data.get('scraped_at'),
                        json.dumps(cleaned_data)
                    ))
                    
                    motorcycle_id = cursor.lastrowid
                
                # 保存相关数据
                self._save_engine_specs(cursor, motorcycle_id, cleaned_data.get('engine'))
                self._save_performance(cursor, motorcycle_id, cleaned_data.get('performance'))
                self._save_dimensions(cursor, motorcycle_id, cleaned_data.get('dimensions'))
                
                conn.commit()
                return True
                
        except Exception as e:
            print(f"保存数据失败: {e}")
            return False
    
    def _save_engine_specs(self, cursor, motorcycle_id: int, engine_data: Optional[Dict]):
        """保存发动机规格数据"""
        if not engine_data:
            return
        
        # 删除旧数据
        cursor.execute("DELETE FROM engine_specs WHERE motorcycle_id = ?", (motorcycle_id,))
        
        # 插入新数据
        cursor.execute("""
            INSERT INTO engine_specs (
                motorcycle_id, type, displacement, bore, stroke,
                compression_ratio, cooling, fuel_system
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            motorcycle_id,
            engine_data.get('type'),
            engine_data.get('displacement'),
            engine_data.get('bore'),
            engine_data.get('stroke'),
            engine_data.get('compression_ratio'),
            engine_data.get('cooling'),
            engine_data.get('fuel_system')
        ))
    
    def _save_performance(self, cursor, motorcycle_id: int, perf_data: Optional[Dict]):
        """保存性能数据"""
        if not perf_data:
            return
        
        cursor.execute("DELETE FROM performance WHERE motorcycle_id = ?", (motorcycle_id,))
        
        cursor.execute("""
            INSERT INTO performance (
                motorcycle_id, power_hp, power_kw, torque_nm, torque_lbft,
                top_speed_mph, top_speed_kmh, acceleration_0_60, quarter_mile
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            motorcycle_id,
            perf_data.get('power_hp'),
            perf_data.get('power_kw'),
            perf_data.get('torque_nm'),
            perf_data.get('torque_lbft'),
            perf_data.get('top_speed_mph'),
            perf_data.get('top_speed_kmh'),
            perf_data.get('acceleration_0_60'),
            perf_data.get('quarter_mile')
        ))
    
    def _save_dimensions(self, cursor, motorcycle_id: int, dim_data: Optional[Dict]):
        """保存尺寸数据"""
        if not dim_data:
            return
        
        cursor.execute("DELETE FROM dimensions WHERE motorcycle_id = ?", (motorcycle_id,))
        
        cursor.execute("""
            INSERT INTO dimensions (
                motorcycle_id, length, width, height, wheelbase,
                ground_clearance, seat_height, dry_weight, wet_weight, fuel_capacity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            motorcycle_id,
            dim_data.get('length'),
            dim_data.get('width'),
            dim_data.get('height'),
            dim_data.get('wheelbase'),
            dim_data.get('ground_clearance'),
            dim_data.get('seat_height'),
            dim_data.get('dry_weight'),
            dim_data.get('wet_weight'),
            dim_data.get('fuel_capacity')
        ))
    
    def save_to_json(self, data: List[Dict[str, Any]], filename: str = None):
        """保存数据到JSON文件"""
        if filename is None:
            filename = f"motorcycles_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        file_path = self.data_dir / "json" / filename
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"数据已保存到: {file_path}")
    
    def save_to_csv(self, filename: str = None):
        """导出数据到CSV文件"""
        if filename is None:
            filename = f"motorcycles_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        file_path = self.data_dir / "csv" / filename
        
        # 从数据库获取数据并转换为DataFrame
        query = """
            SELECT 
                m.brand, m.model, m.year, m.category,
                e.type as engine_type, e.displacement, e.bore, e.stroke,
                p.power_hp, p.torque_nm, p.top_speed_mph, p.acceleration_0_60,
                d.length, d.width, d.height, d.seat_height, d.dry_weight,
                m.source_url, m.scraped_at
            FROM motorcycles m
            LEFT JOIN engine_specs e ON m.id = e.motorcycle_id
            LEFT JOIN performance p ON m.id = p.motorcycle_id
            LEFT JOIN dimensions d ON m.id = d.motorcycle_id
        """
        
        with sqlite3.connect(self.db_path) as conn:
            df = pd.read_sql_query(query, conn)
            df.to_csv(file_path, index=False, encoding='utf-8')
        
        print(f"CSV文件已保存到: {file_path}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """获取数据统计信息"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            stats = {}
            
            # 总记录数
            cursor.execute("SELECT COUNT(*) FROM motorcycles")
            stats['total_motorcycles'] = cursor.fetchone()[0]
            
            # 按品牌统计
            cursor.execute("SELECT brand, COUNT(*) FROM motorcycles GROUP BY brand ORDER BY COUNT(*) DESC")
            stats['by_brand'] = dict(cursor.fetchall())
            
            # 按年份统计
            cursor.execute("SELECT year, COUNT(*) FROM motorcycles GROUP BY year ORDER BY year DESC")
            stats['by_year'] = dict(cursor.fetchall())
            
            # 按类别统计
            cursor.execute("SELECT category, COUNT(*) FROM motorcycles WHERE category IS NOT NULL GROUP BY category ORDER BY COUNT(*) DESC")
            stats['by_category'] = dict(cursor.fetchall())
            
            return stats
    
    def search_motorcycles(self, brand: str = None, model: str = None, 
                         year: int = None, category: str = None) -> List[Dict[str, Any]]:
        """搜索摩托车数据"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            query = "SELECT raw_data FROM motorcycles WHERE 1=1"
            params = []
            
            if brand:
                query += " AND LOWER(brand) LIKE ?"
                params.append(f"%{brand.lower()}%")
            
            if model:
                query += " AND LOWER(model) LIKE ?"
                params.append(f"%{model.lower()}%")
            
            if year:
                query += " AND year = ?"
                params.append(year)
            
            if category:
                query += " AND LOWER(category) = ?"
                params.append(category.lower())
            
            cursor.execute(query, params)
            results = []
            
            for row in cursor.fetchall():
                try:
                    data = json.loads(row[0])
                    results.append(data)
                except json.JSONDecodeError:
                    continue
            
            return results