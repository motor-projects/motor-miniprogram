#!/usr/bin/env python3
"""
摩托车性能数据爬虫主程序
支持从CycleWorld和Motorcycle.com爬取摩托车数据
"""

import sys
import argparse
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any
import time

from scraper_base import ScrapingConfig
from cycleworld_scraper import CycleWorldScraper
from motorcycle_com_scraper import MotorcycleDotComScraper
from data_manager import DataStorage


class MotorcycleScraper:
    """主爬虫类"""
    
    def __init__(self, config: ScrapingConfig = None):
        self.config = config or ScrapingConfig()
        self.storage = DataStorage()
        self.scrapers = {
            'cycleworld': CycleWorldScraper(self.config),
            'motorcycle_com': MotorcycleDotComScraper(self.config)
        }
        
        self.setup_logging()
    
    def setup_logging(self):
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('motorcycle_scraper.log', encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def scrape_website(self, site_name: str, urls: List[str] = None, 
                      categories: List[str] = None) -> List[Dict[str, Any]]:
        """爬取指定网站的数据"""
        if site_name not in self.scrapers:
            self.logger.error(f"不支持的网站: {site_name}")
            return []
        
        scraper = self.scrapers[site_name]
        results = []
        
        try:
            if urls:
                # 爬取指定URL列表
                self.logger.info(f"开始爬取 {site_name} 的 {len(urls)} 个URL")
                
                for i, url in enumerate(urls, 1):
                    self.logger.info(f"正在爬取 ({i}/{len(urls)}): {url}")
                    
                    try:
                        data = scraper.scrape_page(url)
                        if data:
                            results.append(data)
                            # 保存到数据库
                            if self.storage.save_motorcycle(data):
                                self.logger.info(f"成功保存数据: {data.get('brand')} {data.get('model')}")
                            else:
                                self.logger.warning(f"保存数据失败: {url}")
                        else:
                            self.logger.warning(f"未能提取数据: {url}")
                    
                    except Exception as e:
                        self.logger.error(f"爬取页面失败 {url}: {e}")
                        continue
                        
            else:
                # 自动发现并爬取摩托车页面
                self.logger.info(f"开始自动发现 {site_name} 的摩托车页面")
                
                if site_name == 'cycleworld':
                    listing_urls = scraper.get_motorcycle_list_urls()
                elif site_name == 'motorcycle_com':
                    listing_urls = scraper.get_bike_listing_urls()
                else:
                    listing_urls = []
                
                discovered_urls = []
                for listing_url in listing_urls[:3]:  # 限制列表页数量
                    try:
                        page_urls = scraper.extract_motorcycle_urls_from_listing(listing_url)
                        discovered_urls.extend(page_urls)
                        self.logger.info(f"从 {listing_url} 发现了 {len(page_urls)} 个摩托车页面")
                    except Exception as e:
                        self.logger.error(f"获取列表页面失败 {listing_url}: {e}")
                
                # 去重并限制数量
                unique_urls = list(set(discovered_urls))[:50]  # 限制最多50个页面
                self.logger.info(f"总共发现 {len(unique_urls)} 个唯一的摩托车页面")
                
                # 递归调用爬取发现的URL
                if unique_urls:
                    results = self.scrape_website(site_name, unique_urls)
        
        except Exception as e:
            self.logger.error(f"爬取网站 {site_name} 时发生错误: {e}")
        
        self.logger.info(f"从 {site_name} 完成爬取，获得 {len(results)} 条数据")
        return results
    
    def scrape_all_sites(self, max_pages_per_site: int = 25) -> Dict[str, List[Dict[str, Any]]]:
        """爬取所有支持的网站"""
        self.logger.info("开始爬取所有支持的网站")
        
        all_results = {}
        
        for site_name in self.scrapers.keys():
            self.logger.info(f"开始爬取 {site_name}")
            
            try:
                results = self.scrape_website(site_name)
                all_results[site_name] = results
                
                # 短暂休息避免过度请求
                time.sleep(2)
                
            except Exception as e:
                self.logger.error(f"爬取 {site_name} 失败: {e}")
                all_results[site_name] = []
        
        total_results = sum(len(results) for results in all_results.values())
        self.logger.info(f"所有网站爬取完成，总共获得 {total_results} 条数据")
        
        return all_results
    
    def export_data(self, format: str = 'all'):
        """导出数据到文件"""
        self.logger.info(f"开始导出数据，格式: {format}")
        
        try:
            if format in ['json', 'all']:
                # 从数据库获取所有数据
                all_data = self.storage.search_motorcycles()
                if all_data:
                    self.storage.save_to_json(all_data)
                    self.logger.info(f"JSON导出完成，共 {len(all_data)} 条记录")
            
            if format in ['csv', 'all']:
                self.storage.save_to_csv()
                self.logger.info("CSV导出完成")
                
        except Exception as e:
            self.logger.error(f"导出数据失败: {e}")
    
    def show_statistics(self):
        """显示统计信息"""
        stats = self.storage.get_statistics()
        
        print("\n=== 摩托车数据统计 ===")
        print(f"总记录数: {stats['total_motorcycles']}")
        
        print(f"\n按品牌分布 (Top 10):")
        for brand, count in list(stats['by_brand'].items())[:10]:
            print(f"  {brand}: {count}")
        
        print(f"\n按年份分布:")
        for year, count in list(stats['by_year'].items())[:10]:
            print(f"  {year}: {count}")
        
        print(f"\n按类别分布:")
        for category, count in stats['by_category'].items():
            print(f"  {category}: {count}")

def main():
    parser = argparse.ArgumentParser(description="摩托车性能数据爬虫")
    
    parser.add_argument('--site', choices=['cycleworld', 'motorcycle_com', 'all'], 
                       default='all', help='要爬取的网站')
    
    parser.add_argument('--urls', nargs='+', help='要爬取的具体URL列表')
    
    parser.add_argument('--export', choices=['json', 'csv', 'all'], 
                       default='all', help='导出数据格式')
    
    parser.add_argument('--stats', action='store_true', help='显示统计信息')
    
    parser.add_argument('--delay', type=float, default=1.5, 
                       help='请求间延迟时间（秒）')
    
    parser.add_argument('--max-retries', type=int, default=3, 
                       help='最大重试次数')
    
    parser.add_argument('--timeout', type=int, default=15, 
                       help='请求超时时间（秒）')
    
    args = parser.parse_args()
    
    # 创建爬虫配置
    config = ScrapingConfig(
        min_delay=args.delay,
        max_delay=args.delay + 1.0,
        max_retries=args.max_retries,
        timeout=args.timeout
    )
    
    # 初始化爬虫
    scraper = MotorcycleScraper(config)
    
    try:
        if args.stats:
            # 显示统计信息
            scraper.show_statistics()
        
        elif args.urls:
            # 爬取指定URL
            if args.site == 'all':
                print("爬取指定URL时必须指定具体网站")
                sys.exit(1)
            
            scraper.scrape_website(args.site, args.urls)
        
        else:
            # 爬取网站
            if args.site == 'all':
                scraper.scrape_all_sites()
            else:
                scraper.scrape_website(args.site)
        
        # 导出数据
        if not args.stats:
            scraper.export_data(args.export)
        
        # 显示最终统计
        scraper.show_statistics()
        
    except KeyboardInterrupt:
        print("\n爬取被用户中断")
        scraper.logger.info("爬取被用户中断")
    
    except Exception as e:
        print(f"程序出现错误: {e}")
        scraper.logger.error(f"程序出现错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()