import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addAlert } from "../store/alertsSlice";
import type { Alert } from "../store/alertsSlice";
import type { RootState } from "../store";
import toast from "react-hot-toast";

const RESOURCE_TYPES = [
	"Pod",
	"ServiceAccount",
	"Deployment",
	"Node",
	"Ingress",
	"Namespace",
];

function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomFromWeighted<T>(items: { value: T; weight: number }[]): T {
	const total = items.reduce((s, i) => s + i.weight, 0);
	let roll = Math.random() * total;
	for (const i of items) {
		roll -= i.weight;
		if (roll <= 0) return i.value;
	}
	return items[0].value;
}

export default function useMockThreatStream(options?: {
	enabled?: boolean;
	minMs?: number;
	maxMs?: number;
}) {
	const enabled = options?.enabled !== undefined ? options.enabled : true;
	const minMs = options?.minMs ?? 2500;
	const maxMs = options?.maxMs ?? 6000;

	const dispatch = useDispatch();
	const projects = useSelector((s: RootState) => s.projects.projects);
	const tenants = useSelector((s: RootState) => s.tenants.tenants);
	const currentTenantId = useSelector(
		(s: RootState) => s.tenants.currentTenantId
	);
	const currentProjectId = useSelector(
		(s: RootState) => s.projects.currentProjectId
	);

	// Keep refs for scope
	const tenantIdRef = useRef(currentTenantId);
	const projectIdRef = useRef(currentProjectId);
	useEffect(() => {
		tenantIdRef.current = currentTenantId;
	}, [currentTenantId]);
	useEffect(() => {
		projectIdRef.current = currentProjectId;
	}, [currentProjectId]);

	const projectsByTenant = useMemo(() => {
		const map = new Map<
			string,
			{ id: string; tenantId: string; name: string }[]
		>();
		for (const p of projects) {
			if (!map.has(p.tenantId)) map.set(p.tenantId, []);
			map.get(p.tenantId)!.push(p);
		}
		return map;
	}, [projects]);

	useEffect(() => {
		if (!enabled || projects.length === 0 || tenants.length === 0) return;

		let timer: number | undefined;

		const scheduleNext = () => {
			const delay = Math.floor(minMs + Math.random() * (maxMs - minMs));
			timer = window.setTimeout(tick, delay);
		};

		const tick = () => {
			// Prefer current tenant/project if available
			const fallbackTenant = tenants.length > 0 ? tenants[0].id : "t1";
			const tId = tenantIdRef.current || fallbackTenant;

			const candidates = projectsByTenant.get(tId) ?? projects;
			const fallbackProject =
				candidates.length > 0 ? candidates[0].id : projects[0]?.id ?? "p1";
			const scopedProject =
				projectIdRef.current &&
					candidates.some((p) => p.id === projectIdRef.current)
					? projectIdRef.current
					: fallbackProject;

			// Severity and category as plain strings to avoid const assertions
			const sev = randomFromWeighted([
				{ value: "Low", weight: 40 },
				{ value: "Medium", weight: 35 },
				{ value: "High", weight: 18 },
				{ value: "Critical", weight: 7 },
			]) as Alert["severity"];

			const categories: Alert["category"][] = [
				"Runtime",
				"Identity",
				"Config",
				"Network",
			];
			const cat = randomItem(categories);

			const res = randomItem(RESOURCE_TYPES);

			const summaryTemplates: Record<Alert["category"], string[]> = {
				Runtime: [
					"Suspicious exec into %RES in kube-system",
					"Possible container breakout attempt detected",
					"Unhandled exception spike in workload",
				],
				Identity: [
					"ServiceAccount token used from unusual IP",
					"Multiple failed auth attempts for CI user",
					"Privileged role assumed outside business hours",
				],
				Config: [
					"Public S3 bucket detected",
					"K8s RBAC misconfiguration: broad cluster-admin binding",
					"Container running as root without read-only FS",
				],
				Network: [
					"Unusual egress to rare ASN",
					"Port scan behavior observed in namespace",
					"East-west traffic spike between services",
				],
			};

			const template = randomItem(summaryTemplates[cat]);
			const summary = template.replace("%RES", res.toLowerCase());

			const id = `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

			const alert: Alert = {
				id,
				summary,
				severity: sev,
				category: cat,
				time: Date.now(),
				resourceType: res,
				projectId: scopedProject,
				tenantId: tId,
			};

			dispatch(addAlert(alert));

			if (sev === "High" || sev === "Critical") {
				const prefix = sev === "Critical" ? "CRITICAL" : "High";
				toast(`${prefix}: ${summary}`, { id, duration: 4000 });
			}

			scheduleNext();
		};

		scheduleNext();
		return () => {
			if (timer) window.clearTimeout(timer);
		};
	}, [enabled, minMs, maxMs, projects, tenants, projectsByTenant, dispatch]);

	return null;
}
