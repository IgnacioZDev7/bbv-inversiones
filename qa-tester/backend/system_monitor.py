import psutil
import time
from typing import Dict

_last_net = None
_last_net_time = None


def get_system_stats() -> Dict:
    global _last_net, _last_net_time

    cpu_percent = psutil.cpu_percent(interval=0.3)
    cpu_per_core = psutil.cpu_percent(interval=0, percpu=True)
    cpu_freq = psutil.cpu_freq()
    cpu_count = psutil.cpu_count()

    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()

    disk = psutil.disk_usage("/")

    net = psutil.net_io_counters()
    now = time.time()
    if _last_net is not None and _last_net_time is not None:
        dt = now - _last_net_time
        net_sent = (net.bytes_sent - _last_net.bytes_sent) / dt if dt > 0 else 0
        net_recv = (net.bytes_recv - _last_net.bytes_recv) / dt if dt > 0 else 0
    else:
        net_sent = 0
        net_recv = 0
    _last_net = net
    _last_net_time = now

    uptime_seconds = time.time() - psutil.boot_time()
    uptime_h = int(uptime_seconds // 3600)
    uptime_m = int((uptime_seconds % 3600) // 60)

    return {
        "cpu": {
            "percent": round(cpu_percent, 1),
            "per_core": [round(c, 1) for c in cpu_per_core],
            "cores": cpu_count,
            "freq_mhz": round(cpu_freq.current, 0) if cpu_freq else 0,
        },
        "memory": {
            "percent": round(mem.percent, 1),
            "used_gb": round(mem.used / (1024**3), 2),
            "total_gb": round(mem.total / (1024**3), 2),
            "swap_percent": round(swap.percent, 1),
        },
        "disk": {
            "percent": round(disk.percent, 1),
            "used_gb": round(disk.used / (1024**3), 2),
            "total_gb": round(disk.total / (1024**3), 2),
        },
        "network": {
            "sent_mbps": round(net_sent / (1024 * 1024), 2),
            "recv_mbps": round(net_recv / (1024 * 1024), 2),
        },
        "uptime": f"{uptime_h}h {uptime_m}m",
        "timestamp": now,
    }
