#!/usr/bin/env python3
"""
摩托车爬虫快速启动脚本

提供一个简单的菜单界面来运行各种功能
"""

import os
import sys

def show_menu():
    """显示菜单"""
    print("\n🏍️  摩托车数据爬虫系统")
    print("=" * 40)
    print("1. 运行测试套件")
    print("2. 查看使用示例")  
    print("3. 查看数据统计")
    print("4. 爬取CycleWorld数据")
    print("5. 爬取Motorcycle.com数据")
    print("6. 爬取所有网站数据")
    print("7. 导出数据(JSON+CSV)")
    print("8. 显示帮助信息")
    print("9. 退出")
    print("=" * 40)

def run_command(command):
    """运行系统命令"""
    print(f"\n执行命令: {command}")
    print("-" * 40)
    result = os.system(f"python3 {command}")
    
    if result != 0:
        print(f"\n⚠️  命令执行可能出现问题 (返回码: {result})")
    else:
        print(f"\n✅ 命令执行完成")
    
    input("\n按回车键继续...")

def main():
    """主循环"""
    while True:
        show_menu()
        
        try:
            choice = input("\n请选择功能 (1-9): ").strip()
            
            if choice == '1':
                run_command("test_scraper.py")
            
            elif choice == '2':
                run_command("example_usage.py")
            
            elif choice == '3':
                run_command("main_scraper.py --stats")
            
            elif choice == '4':
                print("\n注意：这将开始爬取CycleWorld数据，请确保网络连接正常")
                confirm = input("继续吗？(y/N): ").strip().lower()
                if confirm == 'y':
                    run_command("main_scraper.py --site cycleworld --delay 2.0")
            
            elif choice == '5':
                print("\n注意：这将开始爬取Motorcycle.com数据，请确保网络连接正常")
                confirm = input("继续吗？(y/N): ").strip().lower()
                if confirm == 'y':
                    run_command("main_scraper.py --site motorcycle_com --delay 2.0")
            
            elif choice == '6':
                print("\n注意：这将爬取所有支持的网站，可能需要较长时间")
                confirm = input("继续吗？(y/N): ").strip().lower()
                if confirm == 'y':
                    run_command("main_scraper.py --delay 3.0")
            
            elif choice == '7':
                run_command("main_scraper.py --export all --stats")
            
            elif choice == '8':
                run_command("main_scraper.py --help")
            
            elif choice == '9':
                print("\n👋 感谢使用摩托车数据爬虫系统！")
                break
            
            else:
                print("\n❌ 无效选择，请输入1-9之间的数字")
                input("按回车键继续...")
        
        except KeyboardInterrupt:
            print("\n\n👋 用户中断，退出程序")
            break
        
        except Exception as e:
            print(f"\n❌ 程序出现错误: {e}")
            input("按回车键继续...")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"程序启动失败: {e}")
        print("\n请确保:")
        print("1. 已正确安装Python 3")
        print("2. 已安装所有依赖: pip3 install -r requirements.txt") 
        print("3. 在正确的目录中运行脚本")
        sys.exit(1)