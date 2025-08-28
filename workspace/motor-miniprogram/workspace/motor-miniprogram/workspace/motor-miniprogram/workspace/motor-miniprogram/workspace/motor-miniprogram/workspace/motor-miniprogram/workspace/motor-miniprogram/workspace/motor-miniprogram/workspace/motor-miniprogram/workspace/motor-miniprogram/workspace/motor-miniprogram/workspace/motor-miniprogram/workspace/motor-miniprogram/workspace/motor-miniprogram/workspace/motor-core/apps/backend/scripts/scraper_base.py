import requests
import time
import random
from typing import Optional, Dict, Any, List
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class ScrapingConfig:
    """爬虫配置"""
    min_delay: float = 1.0  # 最小延迟秒数
    max_delay: float = 3.0  # 最大延迟秒数
    max_retries: int = 3  # 最大重试次数
    timeout: int = 10  # 请求超时时间
    concurrent_requests: int = 1  # 并发请求数
    respect_robots_txt: bool = True  # 遵守robots.txt
    
class RateLimiter:
    """请求频率限制器"""
    
    def __init__(self, min_delay: float = 1.0, max_delay: float = 3.0):
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.last_request_time = 0
    
    def wait_if_needed(self):
        """如果需要，等待适当的时间"""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        
        # 随机延迟，避免被检测为机器人
        required_delay = random.uniform(self.min_delay, self.max_delay)
        
        if elapsed < required_delay:
            sleep_time = required_delay - elapsed
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()

class UserAgentRotator:
    """用户代理轮换器"""
    
    def __init__(self):
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
        self.current_index = 0
    
    def get_random_agent(self) -> str:
        """获取随机用户代理"""
        return random.choice(self.user_agents)
    
    def get_next_agent(self) -> str:
        """按顺序获取下一个用户代理"""
        agent = self.user_agents[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.user_agents)
        return agent

class BaseScraper:
    """基础爬虫类"""
    
    def __init__(self, config: Optional[ScrapingConfig] = None):
        self.config = config or ScrapingConfig()
        self.rate_limiter = RateLimiter(self.config.min_delay, self.config.max_delay)
        self.user_agent_rotator = UserAgentRotator()
        self.session = requests.Session()
        self.logger = self._setup_logger()
        
        # 设置默认头部
        self._update_session_headers()
    
    def _setup_logger(self) -> logging.Logger:
        """设置日志记录器"""
        logger = logging.getLogger(f"{self.__class__.__name__}")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def _update_session_headers(self):
        """更新会话头部"""
        self.session.headers.update({
            'User-Agent': self.user_agent_rotator.get_random_agent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def get(self, url: str, **kwargs) -> Optional[requests.Response]:
        """发送GET请求，带有重试和错误处理"""
        self.rate_limiter.wait_if_needed()
        
        for attempt in range(self.config.max_retries):
            try:
                self.logger.info(f"请求 URL: {url} (尝试 {attempt + 1})")
                
                # 每次重试时轮换用户代理
                if attempt > 0:
                    self.session.headers['User-Agent'] = self.user_agent_rotator.get_next_agent()
                
                response = self.session.get(
                    url, 
                    timeout=self.config.timeout,
                    **kwargs
                )
                response.raise_for_status()
                
                self.logger.info(f"成功获取 {url}")
                return response
                
            except requests.exceptions.RequestException as e:
                self.logger.warning(f"请求失败 {url}: {e}")
                
                if attempt < self.config.max_retries - 1:
                    # 指数退避重试
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    self.logger.info(f"等待 {wait_time:.2f} 秒后重试...")
                    time.sleep(wait_time)
                else:
                    self.logger.error(f"所有重试都失败了: {url}")
        
        return None
    
    def parse_html(self, html_content: str) -> BeautifulSoup:
        """解析HTML内容"""
        return BeautifulSoup(html_content, 'html.parser')
    
    def extract_text(self, element, default: str = "") -> str:
        """安全提取文本内容"""
        if element:
            return element.get_text(strip=True)
        return default
    
    def extract_number(self, text: str, default: Optional[float] = None) -> Optional[float]:
        """从文本中提取数字"""
        if not text:
            return default
        
        import re
        # 查找数字（包括小数）
        numbers = re.findall(r'\d+\.?\d*', text.replace(',', ''))
        if numbers:
            try:
                return float(numbers[0])
            except ValueError:
                pass
        return default
    
    def build_absolute_url(self, base_url: str, relative_url: str) -> str:
        """构建绝对URL"""
        return urljoin(base_url, relative_url)
    
    def is_valid_url(self, url: str) -> bool:
        """验证URL是否有效"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False
    
    def get_domain(self, url: str) -> str:
        """获取URL的域名"""
        return urlparse(url).netloc
    
    def scrape_page(self, url: str) -> Optional[Dict[str, Any]]:
        """爬取单个页面的抽象方法，子类需要实现"""
        raise NotImplementedError("子类必须实现此方法")
    
    def scrape_multiple(self, urls: List[str]) -> List[Dict[str, Any]]:
        """爬取多个页面"""
        results = []
        
        for url in urls:
            try:
                result = self.scrape_page(url)
                if result:
                    results.append(result)
            except Exception as e:
                self.logger.error(f"爬取页面失败 {url}: {e}")
                continue
        
        return results
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.session.close()