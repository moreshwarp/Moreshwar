"""Moreshwar Systems Lab • Machine Check. Requires Python 3.9+ and psutil."""
import argparse
import datetime as dt
import html
import json
import os
import platform
import statistics
import tempfile
import time
import webbrowser
from pathlib import Path

try:
    import psutil as ps
except ImportError:
    raise SystemExit("Install the one dependency first: python -m pip install psutil")


def read(fn, *args, default=None):
    try:
        return fn(*args)
    except (OSError, AttributeError, NotImplementedError, ps.Error):
        return default


def gauge(value):
    return f'<meter min="0" max="100" value="{value:.1f}">{value:.1f}%</meter>'


def line(values):
    if not values:
        return ""
    points = " ".join(f"{i*300/max(1,len(values)-1):.1f},{51-v/2:.1f}" for i,v in enumerate(values))
    return f'<svg role="img" aria-label="Percent over time, zero to one hundred" viewBox="0 0 300 52"><polyline points="{points}" fill="none" stroke="#196658" stroke-width="2"/></svg>'


def panel(title, status, body):
    return f'<section><small>{status}</small><h2>{title}</h2>{body}</section>'


def sample(count):
    cores, memory = [], []
    traffic = read(ps.net_io_counters)
    diskio = read(ps.disk_io_counters)
    start = time.monotonic()
    for _ in range(count):
        cores.append(ps.cpu_percent(interval=1, percpu=True))
        memory.append(ps.virtual_memory().percent)
    elapsed = time.monotonic()-start
    return cores, memory, elapsed, traffic, read(ps.net_io_counters), diskio, read(ps.disk_io_counters)


def rates(before, after, fields, elapsed):
    if before is None or after is None:
        return "Counters unavailable."
    rows = []
    for key,label in fields:
        delta = getattr(after,key)-getattr(before,key)
        value = f"{delta/elapsed/1024:.1f} KiB/s" if delta >= 0 else "counter reset"
        rows.append(f"<p>{label} <b>{value}</b></p>")
    return "".join(rows)


def report(args, prior):
    cores, ram, elapsed, rx, tx, disk0, disk1 = sample(args.seconds)
    cpu = [statistics.mean(row) for row in cores]
    avg = statistics.mean(cpu)
    busy = sum(v>=85 for v in cpu)/len(cpu) >= .8
    tight = sum(v>=90 for v in ram)/len(ram) >= .8
    drive = ps.disk_usage(str(Path.home().anchor))
    gib = 1024**3
    free = drive.free/gib
    low = drive.percent >=95 or free < 2
    watch = drive.percent >=85
    system = platform.system()
    version = platform.mac_ver()[0] if system=="Darwin" else platform.version()
    now = dt.datetime.now(dt.timezone.utc)
    record = dict(time=now.isoformat(), version=version, system=system, free=free,
                  cpu=avg, ram=statistics.mean(ram), workload=args.workload,
                  total=drive.total)
    cards = [panel("Processor", "Worth checking" if busy else "Okay during sample",
        f"<strong>{avg:.0f}%</strong> average use{line(cpu)}<p>Heavy work such as compiling code can use every core. If the machine felt slow during light work, repeat the check after closing the busiest app.</p>"),
        panel("Working memory", "Worth checking" if tight else "Okay during sample",
        f"<strong>{record['ram']:.0f}%</strong> average use{line(ram)}<p>{ps.virtual_memory().available/gib:.1f} GiB available at the end. If switching apps feels slow, close one large project and compare another run.</p>"),
        panel("System drive", "Needs attention" if low else "Watch" if watch else "Good headroom",
        f"<strong>{free:.1f} GiB</strong> free{gauge(drive.percent)}<p>{drive.percent}% used. Updates and temporary files need free space. Review large downloads before deleting anything.</p>")]
    core_rows = []
    for i,values in enumerate(zip(*cores)):
        mean = statistics.mean(values)
        core_rows.append(f"<div>Logical CPU {i+1} · {mean:.0f}%{gauge(mean)}</div>")
    cards.append(panel("Inside the processor", "Average use by logical CPU",
        f"<p>{ps.cpu_count(logical=False) or 'Unknown'} physical cores reported. One busy lane can limit a single task even when the average looks low.</p>"+ "".join(core_rows)))
    cards.append(panel("Network traffic","Measured activity",rates(rx,tx,[("bytes_recv","Received"),("bytes_sent","Sent")],elapsed)+"<p>Across interfaces. These readings show transfers during the sample. Connection speed needs a separate speed test.</p>"))
    cards.append(panel("Drive activity","Measured activity",rates(disk0,disk1,[("read_bytes","Read"),("write_bytes","Written")],elapsed)+"<p>Copying files or installing software can increase both readings.</p>"))
    battery = read(getattr(ps,"sensors_battery",lambda:None))
    cards.append(panel("Battery", "Power", f"{battery.percent:.0f}% charge · "+("plugged in" if battery.power_plugged else "using battery") if battery else "Battery reading unavailable on this machine."))
    names=[]
    for p in ps.process_iter(["name","memory_info"], ad_value=None):
        mem=p.info["memory_info"]
        if mem: names.append((mem.rss,p.info["name"] or "Unnamed"))
    cards.append(panel("Apps using memory","Largest individual processes now","".join(f"<p>{html.escape(n)} <b>{m/gib:.2f} GiB</b></p>" for m,n in sorted(names,reverse=True)[:5])+"<p>Some memory is shared. Save your work before closing an app.</p>"))
    links={"Darwin":("macOS","https://support.apple.com/en-us/macos"),"Windows":("Windows","https://learn.microsoft.com/en-us/windows/release-health/"),"Linux":("Linux kernel","https://kernelnewbies.org/LinuxVersions")}
    name,url=links.get(system,("Operating system",""))
    update="First observation of this system version."
    trend="Run again during the same kind of work to build a comparison."
    if prior and prior.get("system")==system:
        old=prior["version"]
        update="Same version as the previous run." if old==version else f"Version changed from {html.escape(old)}. Match the new version to its release notes for changes and examples."
        if prior.get("total")==drive.total:
            change=free-prior["free"]
            trend=f"Free space changed by {change:+.1f} GiB since {html.escape(prior['time'][:10])}. "
            days=(now-dt.datetime.fromisoformat(prior["time"])).total_seconds()/86400
            if days>=1 and change < -0.1:
                trend+=f"If that rate continues, free space would run out in about {free*days/-change:.0f} days. Updates or deleted files can change this estimate."
        if prior.get("workload")==args.workload:
            trend+=f" Average processor use changed by {avg-prior['cpu']:+.0f} percentage points for this workload."
    cards.append(panel("Changes since last time","Local comparison",trend))
    cards.append(panel("System and updates",html.escape(name),f"<p>{html.escape(version)} · {html.escape(platform.machine())}</p><p>{update}</p><a href='{url}'>Read version notes and support information</a>" if url else html.escape(version)))
    cards.append(panel("Measurement guide","How to read this report","<p>Python and psutil sample once per second. Processor use of 85% or memory use of 90% for four fifths of the sample triggers a review. Drive use of 85% triggers a watch, and 95% use or under 2 GiB free triggers attention. These are prompts to investigate. GPU load, temperatures, drive wear and battery health need device-specific readings.</p>"))
    summary="Check your free storage first." if low else "Review the readings marked for attention." if busy or tight or watch else "The sampled resources show room for this workload."
    return record, f"""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Machine Check · local report</title><style>
    *{{box-sizing:border-box}}body{{margin:auto;max-width:1040px;padding:5vw;background:#f5f4ee;color:#182e2a;font:17px/1.55 system-ui}}h1{{font:clamp(2.2rem,6vw,4.4rem)/1.06 Georgia}}main{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:14px}}section{{padding:22px;background:white;border-top:3px solid #246957}}small{{color:#475852}}h2{{margin:.4rem 0}}strong{{font-size:2rem}}meter,svg{{display:block;width:100%}}b{{float:right}}a{{color:#176651}}</style>
    <header>Moreshwar Systems Lab / Machine Check<h1>{summary}</h1><p>{now.astimezone():%d %b %Y · %H:%M %Z} · {elapsed:.0f} seconds · {args.workload}</p></header><main>{''.join(cards)}</main></html>"""


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seconds",type=int,default=30)
    parser.add_argument("--workload",choices=["everyday","idle","development","gaming","creative"],default="everyday")
    parser.add_argument("--output",type=Path,default=Path.home()/"Machine Check")
    parser.add_argument("--no-open",action="store_true")
    args=parser.parse_args()
    if not 2<=args.seconds<=3600: parser.error("Choose 2 to 3600 seconds.")
    folder=args.output.resolve()
    folder.mkdir(mode=0o700,exist_ok=True)
    history=folder/"previous.json"
    try:
        prior=json.loads(history.read_text())
    except (OSError,ValueError):
        prior=None
    print(f"Sampling for {args.seconds} seconds. Use your machine as usual.")
    record,page=report(args,prior)
    with tempfile.NamedTemporaryFile(dir=folder,suffix=".html",prefix="report-",delete=False,mode="w",encoding="utf-8") as output:
        output.write(page)
    with tempfile.NamedTemporaryFile(dir=folder,delete=False,mode="w") as temp:
        json.dump(record,temp)
    os.replace(temp.name,history)
    print(output.name)
    if not args.no_open: webbrowser.open(Path(output.name).as_uri())


if __name__=="__main__":
    main()
