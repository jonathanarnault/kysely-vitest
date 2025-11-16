import { exec } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function startDockerContainer(
	container: DockerContainer,
): Promise<string> {
	const containerName = randomUUID().toString();
	const args = buildContainerArgs(container, containerName);

	await execAsync(`docker run ${args}`);
	await waitForContainer(
		containerName,
		container.healthcheck ? "healthy" : "running",
	);

	return containerName;
}
async function waitForContainer(
	containerName: string,
	status: "healthy" | "running",
): Promise<void> {
	const { stdout } = await execAsync(
		status === "healthy"
			? `docker inspect --format='{{.State.Health.Status}}' ${containerName}`
			: `docker inspect --format='{{.State.Status}}' ${containerName}`,
	);

	if (stdout.trim() === status) {
		return;
	}

	await new Promise((resolve) => setTimeout(resolve, 500));
	return waitForContainer(containerName, status);
}

export type DockerContainer = {
	image: string;
	tag: string;

	environment?: Record<string, string>;
	ports?: Array<{ hostPort: number; containerPort: number }>;
	healthcheck?: {
		test: string[];
		interval?: string;
		timeout?: string;
		retries?: number;
		startPeriod?: string;
	};
};

export async function stopDockerContainer(containerName: string | null) {
	if (!containerName) {
		return;
	}
	await execAsync(`docker rm -f ${containerName}`);
}

export function buildContainerArgs(
	{ image: name, tag, environment, ports, healthcheck }: DockerContainer,
	containerName: string,
): string {
	const portsParts = ports
		? ports.map(
				({ hostPort, containerPort }) => `-p ${hostPort}:${containerPort}`,
			)
		: [];

	const envParts = environment
		? Object.entries(environment).map(([key, value]) => `-e ${key}=${value}`)
		: [];

	const healthcheckParts = healthcheck
		? [
				`--health-cmd="${healthcheck.test.join(" ")}"`,
				healthcheck.interval
					? `--health-interval=${healthcheck.interval}`
					: null,
				healthcheck.timeout ? `--health-timeout=${healthcheck.timeout}` : null,
				healthcheck.retries ? `--health-retries=${healthcheck.retries}` : null,
				healthcheck.startPeriod
					? `--health-start-period=${healthcheck.startPeriod}`
					: null,
			].filter((part): part is string => part !== null)
		: [];

	return [
		"-d",
		`--name ${containerName}`,
		...portsParts,
		...envParts,
		...healthcheckParts,
		`${name}:${tag}`,
	].join(" ");
}
