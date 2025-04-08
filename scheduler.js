console.log("Start!");

const fs = require('fs');
const { parse } = require('csv-parse/sync'); // Correct parser import

const contextSwitchTime = 0;

// Define Process structure
class Process {
    constructor(pid, arrival, burst) {
        this.pid = pid;
        this.arrival = arrival;
        this.burst = burst;
        this.remaining = burst;
        this.start = null;
        this.completion = null;
        this.waiting = 0;
        this.turnaround = 0;
        this.response = null;
    }
}

// Round Robin Scheduler
function roundRobinScheduling(processes, timeQuantum) {
    let clock = 0;
    let queue = [];
    let finished = [];
    let contextSwitches = 0;
    let idleTime = 0;

    processes.sort((a, b) => a.arrival - b.arrival);
    let arrivalIndex = 0;

    while (finished.length < processes.length) {
        while (arrivalIndex < processes.length && processes[arrivalIndex].arrival <= clock) {
            queue.push(processes[arrivalIndex]);
            arrivalIndex++;
        }

        if (queue.length === 0) {
            clock++;
            idleTime++;
            continue;
        }

        let process = queue.shift();
        if (process.start === null) {
            process.start = clock;
            process.response = process.start - process.arrival;
        }

        let execTime = Math.min(timeQuantum, process.remaining);
        clock += execTime;
        process.remaining -= execTime;

        while (arrivalIndex < processes.length && processes[arrivalIndex].arrival <= clock) {
            queue.push(processes[arrivalIndex]);
            arrivalIndex++;
        }

        if (process.remaining > 0) {
            queue.push(process);
        } else {
            process.completion = clock;
            process.turnaround = process.completion - process.arrival;
            process.waiting = process.turnaround - process.burst;
            finished.push(process);
        }

        contextSwitches++;
    }

    printStats(finished, clock, contextSwitches, idleTime);
}

// Output statistics
function printStats(processes, totalTime, contextSwitches, idleTime) {
    console.log("\nPID\tArrival\tBurst\tStart\tComplete\tTurnaround\tWaiting\tResponse");
    let totalWT = 0, totalTAT = 0, totalResp = 0;

    for (let p of processes) {
        console.log(`${p.pid}\t${p.arrival}\t${p.burst}\t${p.start}\t${p.completion}\t\t${p.turnaround}\t\t${p.waiting}\t${p.response}`);
        totalWT += p.waiting;
        totalTAT += p.turnaround;
        totalResp += p.response;
    }

    const avgWT = totalWT / processes.length;
    const avgTAT = totalTAT / processes.length;
    const cpuUtil = 1 - (idleTime / totalTime);
    const throughput = processes.length / totalTime;

    console.log(`\nAverage Waiting Time: ${avgWT.toFixed(2)}`);
    console.log(`Average Turnaround Time: ${avgTAT.toFixed(2)}`);
    console.log(`CPU Utilization: ${(cpuUtil * 100).toFixed(2)}%`);
    console.log(`Throughput: ${throughput.toFixed(2)} processes/unit time`);
    console.log(`Context Switches: ${contextSwitches}`);
}

// === Run the program ===
const filePath = process.argv[2];
const quantum = parseInt(process.argv[3]);

const data = fs.readFileSync(filePath, 'utf8');
const records = parse(data, {
    columns: true,
    trim: true,
    skip_empty_lines: true
});
const processes = records.map(r => new Process(parseInt(r.pid), parseInt(r.arrive), parseInt(r.burst)));
roundRobinScheduling(processes, quantum);
