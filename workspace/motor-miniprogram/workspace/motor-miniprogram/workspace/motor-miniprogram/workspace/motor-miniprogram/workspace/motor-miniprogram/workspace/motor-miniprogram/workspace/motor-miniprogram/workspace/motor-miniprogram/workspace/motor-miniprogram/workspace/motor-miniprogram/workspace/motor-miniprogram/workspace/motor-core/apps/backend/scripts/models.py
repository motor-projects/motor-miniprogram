from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

@dataclass
class EngineSpecs:
    """发动机规格"""
    type: Optional[str] = None  # 发动机类型 (V4, Inline-4, Single, etc.)
    displacement: Optional[float] = None  # 排量 (cc)
    bore: Optional[float] = None  # 缸径 (mm)
    stroke: Optional[float] = None  # 行程 (mm)
    compression_ratio: Optional[str] = None  # 压缩比
    cooling: Optional[str] = None  # 冷却方式
    fuel_system: Optional[str] = None  # 燃油系统

@dataclass
class Performance:
    """性能数据"""
    power_hp: Optional[float] = None  # 功率 (hp)
    power_kw: Optional[float] = None  # 功率 (kW)
    torque_nm: Optional[float] = None  # 扭矩 (Nm)
    torque_lbft: Optional[float] = None  # 扭矩 (lb-ft)
    top_speed_mph: Optional[float] = None  # 最高速度 (mph)
    top_speed_kmh: Optional[float] = None  # 最高速度 (km/h)
    acceleration_0_60: Optional[float] = None  # 0-60 mph 加速时间 (秒)
    quarter_mile: Optional[float] = None  # 四分之一英里时间 (秒)

@dataclass
class Dimensions:
    """尺寸和重量"""
    length: Optional[float] = None  # 长度 (mm)
    width: Optional[float] = None  # 宽度 (mm) 
    height: Optional[float] = None  # 高度 (mm)
    wheelbase: Optional[float] = None  # 轴距 (mm)
    ground_clearance: Optional[float] = None  # 离地间隙 (mm)
    seat_height: Optional[float] = None  # 座椅高度 (mm)
    dry_weight: Optional[float] = None  # 干重 (kg)
    wet_weight: Optional[float] = None  # 湿重 (kg)
    fuel_capacity: Optional[float] = None  # 油箱容量 (L)

@dataclass
class PriceInfo:
    """价格信息"""
    msrp: Optional[float] = None  # 建议零售价
    currency: Optional[str] = "USD"  # 货币单位
    year: Optional[int] = None  # 价格年份

@dataclass
class Rating:
    """评分信息"""
    overall: Optional[float] = None  # 总体评分
    performance: Optional[float] = None  # 性能评分
    comfort: Optional[float] = None  # 舒适性评分
    build_quality: Optional[float] = None  # 制造质量评分
    value: Optional[float] = None  # 性价比评分
    scale: Optional[int] = 10  # 评分满分

@dataclass
class Motorcycle:
    """摩托车主数据模型"""
    # 基本信息
    brand: str
    model: str
    year: int
    category: Optional[str] = None  # 车型类别 (Sport, Cruiser, Touring, etc.)
    
    # 详细规格
    engine: Optional[EngineSpecs] = None
    performance: Optional[Performance] = None
    dimensions: Optional[Dimensions] = None
    price: Optional[PriceInfo] = None
    rating: Optional[Rating] = None
    
    # 元数据
    source_url: Optional[str] = None  # 数据来源URL
    scraped_at: Optional[datetime] = None  # 爬取时间
    updated_at: Optional[datetime] = None  # 更新时间
    
    # 附加信息
    images: Optional[List[str]] = None  # 图片URL列表
    description: Optional[str] = None  # 描述
    features: Optional[List[str]] = None  # 特色功能
    colors: Optional[List[str]] = None  # 可选颜色

    def __post_init__(self):
        if self.scraped_at is None:
            self.scraped_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()

@dataclass
class ReviewData:
    """评测数据"""
    motorcycle_id: str  # 对应摩托车的唯一标识
    reviewer: str  # 评测者/网站
    review_date: Optional[datetime] = None
    title: Optional[str] = None
    content: Optional[str] = None
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None
    verdict: Optional[str] = None
    source_url: Optional[str] = None