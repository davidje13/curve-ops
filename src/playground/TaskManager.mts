export class TaskManager<Data> extends EventTarget {
	declare private readonly tasks: { id: Symbol; data: Data }[];
	declare private readonly workers: Worker[];
	declare private readonly freeWorkers: Set<Worker>;

	constructor(scriptURL: string, concurrency = navigator.hardwareConcurrency) {
		super();

		this.tasks = [];
		this.workers = [];
		this.freeWorkers = new Set();
		for (let i = 0; i < concurrency; ++i) {
			const worker = new Worker(scriptURL, { type: 'module' });
			this.workers.push(worker);
			worker.addEventListener('message', () => {
				const task = this.tasks.shift();
				if (task) {
					worker.postMessage(task.data);
				} else {
					this.freeWorkers.add(worker);
					if (this.freeWorkers.size === this.workers.length) {
						this.dispatchEvent(new CustomEvent('done'));
					}
				}
			});
			this.freeWorkers.add(worker);
		}
	}

	get running() {
		return this.freeWorkers.size < this.workers.length;
	}

	clearTasks(id: Symbol) {
		let del = 0;
		for (let i = 0; i < this.tasks.length; ++i) {
			if (this.tasks[i]!.id === id) {
				++del;
			} else if (del) {
				this.tasks[i - del] = this.tasks[i]!;
			}
		}
		this.tasks.length -= del;
	}

	addTask(id: Symbol, data: Data) {
		for (const worker of this.freeWorkers) {
			this.freeWorkers.delete(worker);
			worker.postMessage(data);
			return;
		}
		this.tasks.push({ id, data });
	}
}
