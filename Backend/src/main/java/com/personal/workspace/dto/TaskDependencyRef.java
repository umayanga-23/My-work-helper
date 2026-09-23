package com.personal.workspace.dto;

import com.personal.workspace.entity.TaskStatus;
import java.util.UUID;

/** Lightweight reference to a task used in dependency lists */
public record TaskDependencyRef(UUID taskId, String taskKey, String title, TaskStatus status) {}
