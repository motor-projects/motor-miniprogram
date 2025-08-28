#!/usr/bin/env python3
"""
摩托车爬虫使用示例

演示如何使用摩托车数据爬虫系统
"""

from main_scraper import MotorcycleScraper
from scraper_base import ScrapingConfig
from data_manager import DataStorage

def example_basic_usage():
    """基础使用示例"""
    print("=== 基础使用示例 ===")
    
    # 创建爬虫配置
    config = ScrapingConfig(
        min_delay=2.0,    # 最小延迟2秒
        max_delay=4.0,    # 最大延迟4秒  
        max_retries=3,    # 最大重试3次
        timeout=20        # 超时20秒
    )
    
    # 初始化爬虫
    scraper = MotorcycleScraper(config)
    
    # 显示当前数据统计
    print("\n当前数据库统计:")
    scraper.show_statistics()

def example_data_search():
    """数据搜索示例"""
    print("\n=== 数据搜索示例 ===")
    
    storage = DataStorage()
    
    # 搜索Honda品牌的摩托车
    honda_bikes = storage.search_motorcycles(brand="Honda")
    print(f"找到 {len(honda_bikes)} 辆Honda摩托车")
    
    for bike in honda_bikes[:3]:  # 显示前3辆
        print(f"- {bike.get('year', 'N/A')} {bike.get('brand', 'N/A')} {bike.get('model', 'N/A')}")
    
    # 搜索运动型摩托车
    sport_bikes = storage.search_motorcycles(category="sport")
    print(f"\n找到 {len(sport_bikes)} 辆运动型摩托车")
    
    # 搜索2023年的摩托车
    bikes_2023 = storage.search_motorcycles(year=2023)
    print(f"找到 {len(bikes_2023)} 辆2023年的摩托车")

def example_custom_scraping():
    """自定义爬取示例"""
    print("\n=== 自定义爬取示例 ===")
    
    # 创建快速配置（仅用于演示，实际使用请调大延迟）
    fast_config = ScrapingConfig(
        min_delay=0.5,
        max_delay=1.0,
        max_retries=2,
        timeout=10
    )
    
    scraper = MotorcycleScraper(fast_config)
    
    # 示例URL列表（这些是示例URL，实际使用时需要真实的评测页面URL）
    sample_urls = [
        # 注意：这些是示例URL，实际运行时需要替换为真实的评测页面
        # "https://www.cycleworld.com/story/reviews/2023-honda-cbr1000rr-r/",
        # "https://www.motorcycle.com/reviews/2023-yamaha-yzf-r1",
    ]
    
    if sample_urls:
        print(f"开始爬取 {len(sample_urls)} 个指定URL...")
        results = scraper.scrape_website('cycleworld', sample_urls)
        print(f"成功爬取 {len(results)} 条数据")
    else:
        print("示例URL列表为空，跳过爬取")

def example_data_export():
    """数据导出示例"""
    print("\n=== 数据导出示例 ===")
    
    scraper = MotorcycleScraper()
    
    # 导出JSON格式
    print("导出JSON格式数据...")
    scraper.export_data('json')
    
    # 导出CSV格式  
    print("导出CSV格式数据...")
    scraper.export_data('csv')
    
    print("数据导出完成！检查 data/ 目录下的文件")

def show_data_structure():
    """显示数据结构示例"""
    print("\n=== 数据结构示例 ===")
    
    sample_data = {
        "brand": "Honda",
        "model": "CBR1000RR-R Fireblade SP",
        "year": 2023,
        "category": "sport",
        "engine": {
            "type": "Inline-4",
            "displacement": 999.9,
            "bore": 81.0,
            "stroke": 48.5,
            "compression_ratio": "13.0:1",
            "cooling": "Liquid-cooled",
            "fuel_system": "PGM-FI"
        },
        "performance": {
            "power_hp": 214.6,
            "torque_nm": 113.2,
            "top_speed_mph": 186.0,
            "acceleration_0_60": 3.1
        },
        "dimensions": {
            "length": 2075.0,
            "width": 720.0,
            "height": 1125.0,
            "wheelbase": 1455.0,
            "seat_height": 830.0,
            "dry_weight": 201.0,
            "fuel_capacity": 16.1
        },
        "price": {
            "msrp": 28500.0,
            "currency": "USD",
            "year": 2023
        }
    }
    
    print("摩托车数据结构示例:")
    import json
    print(json.dumps(sample_data, indent=2, ensure_ascii=False))

def main():
    """主函数 - 运行所有示例"""
    print("🏍️  摩托车数据爬虫使用示例")
    print("=" * 50)
    
    try:
        # 显示数据结构
        show_data_structure()
        
        # 基础使用
        example_basic_usage()
        
        # 数据搜索
        example_data_search()
        
        # 数据导出
        example_data_export()
        
        # 自定义爬取（仅显示示例，不实际运行）
        example_custom_scraping()
        
    except Exception as e:
        print(f"运行示例时出现错误: {e}")
        print("\n建议:")
        print("1. 确保已安装所有依赖: pip3 install -r requirements.txt")
        print("2. 确保有网络连接")
        print("3. 查看错误日志获取更多信息")
    
    print("\n" + "=" * 50)
    print("示例运行完毕！")
    print("\n使用说明:")
    print("1. 运行完整爬虫: python3 main_scraper.py")
    print("2. 查看帮助: python3 main_scraper.py --help") 
    print("3. 运行测试: python3 test_scraper.py")
    print("4. 查看统计: python3 main_scraper.py --stats")

if __name__ == "__main__":
    main()