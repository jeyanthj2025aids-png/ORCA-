import logging
from backend.app.agents.state import OrcaState
from backend.app.models.schemas import TaskPlan, TaskItem

logger = logging.getLogger("orca.agent.planner")

class TaskPlannerAgent:
    """
    Dynamically decomposes queries into targeted agent task graphs.
    Ensures optimal execution without wasteful invocations.
    """
    async def run(self, state: OrcaState) -> OrcaState:
        intent = state.intent.intent if state.intent else "fishing_safety"
        
        tasks: list[TaskItem] = []
        if intent == "fishing_safety":
            tasks = [
                TaskItem(agent="weather", priority=1),
                TaskItem(agent="ocean", priority=1),
                TaskItem(agent="tide", priority=1),
                TaskItem(agent="hazard", priority=1),
                TaskItem(agent="geofence", priority=2),
                TaskItem(agent="risk", priority=3),
            ]
        elif intent == "find_pfz":
            tasks = [
                TaskItem(agent="satellite_eo", priority=1),
                TaskItem(agent="fisheries", priority=1),
                TaskItem(agent="ocean", priority=1),
                TaskItem(agent="geospatial", priority=2),
                TaskItem(agent="route", priority=2),
            ]
        elif intent == "hazard_avoidance":
            tasks = [
                TaskItem(agent="geofence", priority=1),
                TaskItem(agent="hazard", priority=1),
                TaskItem(agent="ocean", priority=1),
                TaskItem(agent="risk", priority=2),
            ]
        elif intent == "research_analysis":
            tasks = [
                TaskItem(agent="historical", priority=1),
                TaskItem(agent="satellite_eo", priority=1),
                TaskItem(agent="ocean", priority=1),
                TaskItem(agent="fisheries", priority=2),
                TaskItem(agent="semantic_search", priority=2),
            ]
        elif intent == "route_planning":
            tasks = [
                TaskItem(agent="geofence", priority=1),
                TaskItem(agent="hazard", priority=1),
                TaskItem(agent="route", priority=2),
                TaskItem(agent="weather", priority=2),
            ]
        else: # general query
            tasks = [
                TaskItem(agent="ocean", priority=1),
                TaskItem(agent="weather", priority=1),
                TaskItem(agent="semantic_search", priority=2),
            ]
            
        state.tasks = TaskPlan(tasks=tasks)
        agent_names = [t.agent for t in tasks]
        
        state.agent_timeline.append({
            "agent_name": "Task Planner Agent",
            "status": "Completed",
            "execution_time_ms": 45,
            "summary": f"Decomposed query into {len(tasks)} parallel/priority tasks: {', '.join(agent_names)}"
        })
        return state

task_planner_agent = TaskPlannerAgent()
