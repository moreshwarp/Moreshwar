# Queueing Theory, Little's Law, and Demystifying Unix Load Averages 🚦📈

> **Author**: Machina Telemetry Research Group  
> **Topic**: Queueing Theory, Operating System Schedulers, Performance Modeling  
> **Keywords**: Load Average, Little's Law, Exponential Smoothing, Run Queue, M/M/c Queue, CPU Saturation  

---

## 1. What Exactly is a "Load Average"?

Almost every Unix, Linux, and macOS system displays three numbers in terminal telemetry:
```
load averages: 3.25 2.80 2.45
```
Most users know these represent $1$, $5$, and $15$-minute averages, but what do the numbers actually measure?

A Unix load average is **not** a CPU percentage. It is a measurement of the **average length of the operating system's execution run-queue**:

$$\text{Load} = \text{Average Number of Threads Running} + \text{Threads Waiting in the Run Queue}$$

On modern kernels, this also includes threads placed in uninterruptible sleep states (`TASK_UNINTERRUPTIBLE`) while waiting on disk I/O operations or hardware page faults.

---

## 2. The Multi-Server Queue Model ($M/M/c$)

In classical queueing theory (Kendall's Notation), an $N$-core computer behaves as an **$M/M/c$ multi-server queueing system**, where:
* $c$: Number of parallel service channels (physical CPU cores, e.g. $c = 10$ on Apple M4).
* $\lambda$: Arrival rate of process tasks.
* $\mu$: Service rate per core.

```
Incoming Tasks (λ) ---> [ Run-Queue Buffer (Waiting Area) ]
                                  |
               +------------------+------------------+
               |                  |                  |
           [ Core 0 ]         [ Core 1 ]   ...   [ Core 9 ]
               |                  |                  |
           Departure          Departure          Departure
```

### The Three Operational Regimes:
1. **Under-capacity ($\text{Load} < c$)**:
   $$\text{Load} = 3.25, \quad c = 10 \implies 3.25 \text{ cores occupied, } 6.75 \text{ cores idle.}$$
   Arriving processes begin execution immediately with **zero queue wait time**!
2. **Exact Saturation ($\text{Load} = c$)**:
   Every single core is busy. No threads are waiting in line, but any new arrival will be delayed.
3. **Queue Congestion ($\text{Load} > c$)**:
   $$\text{Load} = 14.50, \quad c = 10 \implies 10 \text{ cores busy, } 4.50 \text{ threads waiting in line!}$$
   Processes experience scheduling latency and latency jitter.

---

## 3. Little's Law and Mathematical Formulation

One of the fundamental theorems of queueing theory is **Little's Law** (John Little, 1961):

$$L = \lambda \cdot W$$

Where:
* $L$: Average number of tasks in the system (the Load Average).
* $\lambda$: Task arrival rate per second.
* $W$: Average total response time spent by a task in the system (Queue Wait Time + Execution Time).

If the load $L$ doubles while arrival rate $\lambda$ is constant, average response time $W$ must double!

---

## 4. The Exponential Damped Smoothing Filter

Unix does not take a simple arithmetic mean over 60 seconds (which would discard older data abruptly). Instead, it updates the load metric every **$5\text{ seconds}$** using an **exponentially decaying moving average (EMA)**:

$$\text{Load}_t = \text{Load}_{t-1} \cdot e^{-\Delta t / T} + n \cdot (1 - e^{-\Delta t / T})$$

Where:
* $\Delta t = 5\text{ seconds}$ (kernel update frequency).
* $T \in \{60, 300, 900\}\text{ seconds}$ for the $1$, $5$, and $15$-minute tracking windows.
* $n$: Instantaneous count of active and queued threads sampled at timer tick.

### Decay Constant Values:
* For 1-minute load ($T = 60\text{s}$): $e^{-5/60} \approx 0.9200$
* For 5-minute load ($T = 300\text{s}$): $e^{-5/300} \approx 0.9835$
* For 15-minute load ($T = 900\text{s}$): $e^{-5/900} \approx 0.9945$

This formulation ensures that transient bursts (like compiling a single file for 2 seconds) do not cause wild swings in the metric, while prolonged saturation is accurately reflected over time.
