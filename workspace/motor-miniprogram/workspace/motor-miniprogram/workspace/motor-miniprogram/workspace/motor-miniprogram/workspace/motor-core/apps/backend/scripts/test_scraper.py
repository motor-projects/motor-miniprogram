#!/usr/bin/env python3
"""
摩托车爬虫测试脚本
用于测试各个组件的功能
"""

import unittest
from unittest.mock import Mock, patch
import json
import os
import tempfile
from datetime import datetime

from scraper_base import BaseScraper, ScrapingConfig, RateLimiter, UserAgentRotator
from cycleworld_scraper import CycleWorldScraper
from motorcycle_com_scraper import MotorcycleDotComScraper
from data_manager import DataCleaner, DataStorage
from models import Motorcycle, EngineSpecs, Performance


class TestBaseScraper(unittest.TestCase):
    """测试基础爬虫类"""
    
    def setUp(self):
        self.config = ScrapingConfig(min_delay=0.1, max_delay=0.2)
        self.scraper = BaseScraper(self.config)
    
    def test_rate_limiter(self):
        """测试请求限制器"""
        limiter = RateLimiter(0.1, 0.2)
        
        start_time = datetime.now()
        limiter.wait_if_needed()
        limiter.wait_if_needed()
        end_time = datetime.now()
        
        # 第二次调用应该有延迟
        elapsed = (end_time - start_time).total_seconds()
        self.assertGreater(elapsed, 0.1)
    
    def test_user_agent_rotator(self):
        """测试用户代理轮换器"""
        rotator = UserAgentRotator()
        
        agent1 = rotator.get_random_agent()
        agent2 = rotator.get_random_agent()
        
        self.assertIsInstance(agent1, str)
        self.assertIsInstance(agent2, str)
        self.assertTrue(len(agent1) > 50)
    
    def test_extract_number(self):
        """测试数字提取功能"""
        # 测试各种格式的数字提取
        test_cases = [
            ("123 hp", 123.0),
            ("$12,345", 12345.0),
            ("45.6 mph", 45.6),
            ("no numbers", None),
            (None, None)
        ]
        
        for text, expected in test_cases:
            result = self.scraper.extract_number(text)
            self.assertEqual(result, expected)
    
    def test_url_validation(self):
        """测试URL验证"""
        valid_urls = [
            "https://www.example.com",
            "http://test.com/page",
            "https://site.com/path/page.html"
        ]
        
        invalid_urls = [
            "not-a-url",
            "",
            None
        ]
        
        for url in valid_urls:
            self.assertTrue(self.scraper.is_valid_url(url))
        
        for url in invalid_urls:
            self.assertFalse(self.scraper.is_valid_url(url))


class TestDataCleaner(unittest.TestCase):
    """测试数据清理器"""
    
    def test_clean_text(self):
        """测试文本清理"""
        test_cases = [
            ("  Normal text  ", "Normal text"),
            ("Text\twith\ttabs", "Text with tabs"),
            ("Text\n\nwith\nlines", "Text with lines"),
            ("Text@#$%with^&*special", "Textwithspecial"),
            ("", "")
        ]
        
        for input_text, expected in test_cases:
            result = DataCleaner._clean_text(input_text)
            self.assertEqual(result, expected)
    
    def test_clean_year(self):
        """测试年份清理"""
        current_year = datetime.now().year
        
        test_cases = [
            (2023, 2023),
            ("2022", 2022),
            ("Honda CBR 2021 Sport", 2021),
            ("invalid", current_year),
            (1899, current_year),  # 太早的年份
            (2050, current_year),  # 太晚的年份
        ]
        
        for input_year, expected in test_cases:
            result = DataCleaner._clean_year(input_year)
            self.assertEqual(result, expected)
    
    def test_clean_number(self):
        """测试数字清理"""
        test_cases = [
            (123, 123.0),
            ("456.7", 456.7),
            ("$1,234", 1234.0),
            ("123 hp", 123.0),
            ("invalid", None),
            (None, None)
        ]
        
        for input_val, expected in test_cases:
            result = DataCleaner._clean_number(input_val)
            self.assertEqual(result, expected)
    
    def test_clean_motorcycle_data(self):
        """测试完整的摩托车数据清理"""
        test_data = {
            'brand': '  Honda  ',
            'model': 'CBR1000RR-R',
            'year': '2023',
            'engine': {
                'displacement': '999.9',
                'type': 'Inline-4'
            },
            'performance': {
                'power_hp': '200.5',
                'torque_nm': '113.2'
            },
            'images': [
                'https://example.com/image1.jpg',
                'invalid-url',
                'https://example.com/image2.png'
            ],
            'features': ['Feature 1', '', 'Very long feature description that might be too long for our standards and should be filtered out because it exceeds the maximum length limit of 200 characters which is set in the data cleaner to ensure that we do not store overly verbose feature descriptions that would clutter the database and make the user interface difficult to read and understand properly']
        }
        
        cleaned = DataCleaner.clean_motorcycle_data(test_data)
        
        self.assertEqual(cleaned['brand'], 'Honda')
        self.assertEqual(cleaned['model'], 'CBR1000RR-R')
        self.assertEqual(cleaned['year'], 2023)
        self.assertEqual(cleaned['engine']['displacement'], 999.9)
        self.assertEqual(len(cleaned['images']), 2)  # 无效URL被过滤
        self.assertEqual(len(cleaned['features']), 1)  # 空值和过长文本被过滤


class TestDataStorage(unittest.TestCase):
    """测试数据存储功能"""
    
    def setUp(self):
        # 创建临时目录用于测试
        self.temp_dir = tempfile.mkdtemp()
        self.storage = DataStorage(self.temp_dir)
    
    def tearDown(self):
        # 清理临时文件
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_database_initialization(self):
        """测试数据库初始化"""
        # 检查数据库文件是否创建
        db_path = self.storage.db_path
        self.assertTrue(os.path.exists(db_path))
        
        # 检查表是否创建
        import sqlite3
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            expected_tables = ['motorcycles', 'engine_specs', 'performance', 'dimensions']
            for table in expected_tables:
                self.assertIn(table, tables)
    
    def test_save_motorcycle(self):
        """测试保存摩托车数据"""
        test_data = {
            'brand': 'Honda',
            'model': 'CBR1000RR',
            'year': 2023,
            'category': 'sport',
            'source_url': 'https://example.com/honda-cbr1000rr',
            'engine': {
                'displacement': 999.0,
                'type': 'Inline-4'
            },
            'performance': {
                'power_hp': 200.0,
                'torque_nm': 113.0
            }
        }
        
        # 保存数据
        result = self.storage.save_motorcycle(test_data)
        self.assertTrue(result)
        
        # 验证数据是否保存
        import sqlite3
        with sqlite3.connect(self.storage.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM motorcycles WHERE brand = ? AND model = ?", 
                         ('Honda', 'CBR1000RR'))
            count = cursor.fetchone()[0]
            self.assertEqual(count, 1)
    
    def test_data_hash_generation(self):
        """测试数据哈希生成"""
        data1 = {'brand': 'Honda', 'model': 'CBR', 'year': 2023, 'source_url': 'url1'}
        data2 = {'brand': 'Honda', 'model': 'CBR', 'year': 2023, 'source_url': 'url1'}
        data3 = {'brand': 'Honda', 'model': 'CBR', 'year': 2024, 'source_url': 'url1'}
        
        hash1 = self.storage.generate_data_hash(data1)
        hash2 = self.storage.generate_data_hash(data2)
        hash3 = self.storage.generate_data_hash(data3)
        
        self.assertEqual(hash1, hash2)  # 相同数据应该产生相同哈希
        self.assertNotEqual(hash1, hash3)  # 不同数据应该产生不同哈希
    
    def test_search_motorcycles(self):
        """测试摩托车搜索功能"""
        # 先保存一些测试数据
        test_bikes = [
            {'brand': 'Honda', 'model': 'CBR1000RR', 'year': 2023, 'category': 'sport'},
            {'brand': 'Yamaha', 'model': 'R1', 'year': 2023, 'category': 'sport'},
            {'brand': 'Honda', 'model': 'Gold Wing', 'year': 2022, 'category': 'touring'}
        ]
        
        for bike in test_bikes:
            self.storage.save_motorcycle(bike)
        
        # 测试按品牌搜索
        honda_bikes = self.storage.search_motorcycles(brand='Honda')
        self.assertEqual(len(honda_bikes), 2)
        
        # 测试按类别搜索
        sport_bikes = self.storage.search_motorcycles(category='sport')
        self.assertEqual(len(sport_bikes), 2)
        
        # 测试多条件搜索
        honda_sport = self.storage.search_motorcycles(brand='Honda', category='sport')
        self.assertEqual(len(honda_sport), 1)


class TestScraperIntegration(unittest.TestCase):
    """测试爬虫集成功能"""
    
    def setUp(self):
        self.config = ScrapingConfig(min_delay=0.1, max_delay=0.2)
    
    @patch('requests.Session.get')
    def test_cycleworld_scraper(self, mock_get):
        """测试CycleWorld爬虫（使用模拟响应）"""
        # 模拟HTML响应
        mock_response = Mock()
        mock_response.text = """
        <html>
            <head><title>2023 Honda CBR1000RR Review</title></head>
            <body>
                <h1>2023 Honda CBR1000RR-R Fireblade SP Review</h1>
                <div class="specifications">
                    <p>Engine: 999cc Inline-4</p>
                    <p>Power: 217 hp</p>
                    <p>Torque: 113 Nm</p>
                    <p>Weight: 201 kg</p>
                </div>
                <div class="price">MSRP: $28,500</div>
            </body>
        </html>
        """
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        scraper = CycleWorldScraper(self.config)
        
        # 测试页面爬取
        result = scraper.scrape_page("https://example.com/honda-cbr")
        
        self.assertIsNotNone(result)
        self.assertIn('brand', result)
        self.assertIn('model', result)
        
    @patch('requests.Session.get')
    def test_motorcycle_com_scraper(self, mock_get):
        """测试Motorcycle.com爬虫（使用模拟响应）"""
        mock_response = Mock()
        mock_response.text = """
        <html>
            <head><title>Yamaha R1 2023 Test</title></head>
            <body>
                <h1>2023 Yamaha YZF-R1</h1>
                <div class="bike-specs">
                    <p>Displacement: 998cc</p>
                    <p>Power: 200 hp</p>
                    <p>Category: SuperSport</p>
                </div>
            </body>
        </html>
        """
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        scraper = MotorcycleDotComScraper(self.config)
        
        result = scraper.scrape_page("https://example.com/yamaha-r1")
        
        self.assertIsNotNone(result)


def run_performance_test():
    """性能测试"""
    print("\n=== 性能测试 ===")
    
    # 测试数据清理性能
    import time
    
    test_data = {
        'brand': 'Honda',
        'model': 'CBR1000RR',
        'year': 2023,
        'engine': {'displacement': '999cc'},
        'performance': {'power_hp': '200hp'},
        'features': ['Feature ' + str(i) for i in range(100)]
    }
    
    start_time = time.time()
    for _ in range(1000):
        DataCleaner.clean_motorcycle_data(test_data)
    
    end_time = time.time()
    print(f"数据清理性能: 1000次清理耗时 {end_time - start_time:.2f} 秒")
    
    # 测试数据库性能
    temp_dir = tempfile.mkdtemp()
    storage = DataStorage(temp_dir)
    
    start_time = time.time()
    for i in range(100):
        test_bike = {
            'brand': f'Brand{i}',
            'model': f'Model{i}',
            'year': 2020 + (i % 4),
            'category': 'sport'
        }
        storage.save_motorcycle(test_bike)
    
    end_time = time.time()
    print(f"数据库性能: 100次保存耗时 {end_time - start_time:.2f} 秒")
    
    # 清理
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)


def main():
    """主测试函数"""
    print("开始运行摩托车爬虫测试...")
    
    # 运行单元测试
    test_suite = unittest.TestLoader().loadTestsFromModule(__import__(__name__))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # 运行性能测试
    run_performance_test()
    
    # 测试结果总结
    if result.wasSuccessful():
        print("\n✅ 所有测试通过！")
    else:
        print(f"\n❌ {len(result.failures)} 个测试失败, {len(result.errors)} 个错误")
        
        if result.failures:
            print("\n失败的测试:")
            for test, traceback in result.failures:
                print(f"  - {test}: {traceback}")
        
        if result.errors:
            print("\n错误的测试:")
            for test, traceback in result.errors:
                print(f"  - {test}: {traceback}")


if __name__ == "__main__":
    main()