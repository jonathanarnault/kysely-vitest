import { exec } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
	buildContainerArgs,
	type DockerContainer,
	startDockerContainer,
	stopDockerContainer,
} from "./docker.js";

const execAsync = promisify(exec);

describe("buildContainerArgs", () => {
	it("builds basic container args with image and tag", () => {
		const container: DockerContainer = {
			image: "postgres",
			tag: "18",
		};

		const result = buildContainerArgs(container, "test-container");

		expect(result).toBe("-d --name test-container postgres:18");
	});

	it.each([
		{
			description: "single variable",
			environment: {
				POSTGRES_USER: "admin",
			} as Record<string, string>,
			expected: "-d --name test-container -e POSTGRES_USER=admin postgres:18",
		},
		{
			description: "multiple variables",
			environment: {
				POSTGRES_USER: "admin",
				POSTGRES_PASSWORD: "secret",
			} as Record<string, string>,
			expected:
				"-d --name test-container -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=secret postgres:18",
		},
		{
			description: "empty object",
			environment: {} as Record<string, string>,
			expected: "-d --name test-container postgres:18",
		},
	])("includes environment: $description", ({ environment, expected }) => {
		const container: DockerContainer = {
			image: "postgres",
			tag: "18",
			environment,
		};

		const result = buildContainerArgs(container, "test-container");

		expect(result).toBe(expected);
	});

	it.each([
		{
			description: "single port",
			ports: [{ hostPort: 5432, containerPort: 5432 }],
			expected: "-d --name test-container -p 5432:5432 postgres:18",
		},
		{
			description: "multiple ports",
			ports: [
				{ hostPort: 5432, containerPort: 5432 },
				{ hostPort: 8080, containerPort: 80 },
			],
			expected: "-d --name test-container -p 5432:5432 -p 8080:80 postgres:18",
		},
		{
			description: "empty array",
			ports: [],
			expected: "-d --name test-container postgres:18",
		},
	])("includes ports: $description", ({ ports, expected }) => {
		const container: DockerContainer = {
			image: "postgres",
			tag: "18",
			ports,
		};

		const result = buildContainerArgs(container, "test-container");

		expect(result).toBe(expected);
	});

	it.each([
		{
			description: "all options",
			healthcheck: {
				test: ["CMD-SHELL", "pg_isready"],
				interval: "5s",
				timeout: "3s",
				retries: 3,
				startPeriod: "10s",
			},
			expected:
				'-d --name test-container --health-cmd="CMD-SHELL pg_isready" --health-interval=5s --health-timeout=3s --health-retries=3 --health-start-period=10s postgres:18',
		},
		{
			description: "only test command",
			healthcheck: {
				test: ["CMD", "pg_isready", "-U", "postgres"],
			},
			expected:
				'-d --name test-container --health-cmd="CMD pg_isready -U postgres" postgres:18',
		},
		{
			description: "test and interval",
			healthcheck: {
				test: ["CMD-SHELL", "pg_isready"],
				interval: "5s",
			},
			expected:
				'-d --name test-container --health-cmd="CMD-SHELL pg_isready" --health-interval=5s postgres:18',
		},
		{
			description: "test and timeout",
			healthcheck: {
				test: ["CMD-SHELL", "pg_isready"],
				timeout: "3s",
			},
			expected:
				'-d --name test-container --health-cmd="CMD-SHELL pg_isready" --health-timeout=3s postgres:18',
		},
		{
			description: "test and retries",
			healthcheck: {
				test: ["CMD-SHELL", "pg_isready"],
				retries: 5,
			},
			expected:
				'-d --name test-container --health-cmd="CMD-SHELL pg_isready" --health-retries=5 postgres:18',
		},
		{
			description: "test and start period",
			healthcheck: {
				test: ["CMD-SHELL", "pg_isready"],
				startPeriod: "10s",
			},
			expected:
				'-d --name test-container --health-cmd="CMD-SHELL pg_isready" --health-start-period=10s postgres:18',
		},
		{
			description: "test, interval, and retries",
			healthcheck: {
				test: ["CMD-SHELL", "pg_isready"],
				interval: "5s",
				retries: 3,
			},
			expected:
				'-d --name test-container --health-cmd="CMD-SHELL pg_isready" --health-interval=5s --health-retries=3 postgres:18',
		},
	])("includes healthcheck: $description", ({ healthcheck, expected }) => {
		const container: DockerContainer = {
			image: "postgres",
			tag: "18",
			healthcheck,
		};

		const result = buildContainerArgs(container, "test-container");

		expect(result).toBe(expected);
	});

	it("combines all options when provided", () => {
		const container: DockerContainer = {
			image: "postgres",
			tag: "18",
			environment: {
				POSTGRES_USER: "admin",
			},
			ports: [{ hostPort: 5432, containerPort: 5432 }],
			healthcheck: {
				test: ["CMD-SHELL", "pg_isready"],
				interval: "5s",
			},
		};

		const result = buildContainerArgs(container, "test-container");

		expect(result).toBe(
			'-d --name test-container -p 5432:5432 -e POSTGRES_USER=admin --health-cmd="CMD-SHELL pg_isready" --health-interval=5s postgres:18',
		);
	});
});

describe("runContainer", () => {
	it("should run a container and wait for it to be healthy", async () => {
		let containerName: string | null = null;
		try {
			const container: DockerContainer = {
				image: "postgres",
				tag: "18-alpine",
				healthcheck: {
					test: ["pg_isready", "-U", "test"],
					interval: "2s",
					timeout: "1s",
					retries: 10,
				},
				environment: {
					POSTGRES_DB: "testdb",
					POSTGRES_USER: "test",
					POSTGRES_PASSWORD: "secret",
				},
			};

			containerName = await startDockerContainer(container);

			const { stdout } = await execAsync(
				`docker ps --filter "name=${containerName}" --filter "health=healthy" --format "{{.Names}}"`,
			);
			expect(stdout.toString().trim()).toBe(containerName);
		} finally {
			await stopDockerContainer(containerName);
			const { stdout } = await execAsync(
				`docker ps --filter "name=${containerName}" --format "{{.Names}}"`,
			);
			expect(stdout.toString().trim()).toBe("");
		}
	}, 15_000);

	it("should run a container without healthcheck", async () => {
		let containerName: string | null = null;
		try {
			const container: DockerContainer = {
				image: "postgres",
				tag: "18-alpine",
				environment: {
					POSTGRES_DB: "testdb",
					POSTGRES_USER: "test",
					POSTGRES_PASSWORD: "secret",
				},
			};

			containerName = await startDockerContainer(container);

			const { stdout } = await execAsync(
				`docker ps --filter "name=${containerName}" --format "{{.Names}}"`,
			);
			expect(stdout.toString().trim()).toBe(containerName);
		} finally {
			await stopDockerContainer(containerName);
			const { stdout } = await execAsync(
				`docker ps --filter "name=${containerName}" --format "{{.Names}}"`,
			);
			expect(stdout.toString().trim()).toBe("");
		}
	}, 15_000);
});
