package com.personal.workspace.scheduler;

import com.personal.workspace.service.RecurringTaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

/**
 * Scheduled daemon responsible for automatically generating task instances
 * from active recurring task templates every morning at 04:00 AM.
 * Uses Sri Lanka timezone (Asia/Colombo / UTC+05:30).
 */
@Component
public class RecurringTaskScheduler {

    private static final Logger log = LoggerFactory.getLogger(RecurringTaskScheduler.class);

    private final RecurringTaskService recurringTaskService;

    public RecurringTaskScheduler(RecurringTaskService recurringTaskService) {
        this.recurringTaskService = recurringTaskService;
    }

    /**
     * Executes every day at 04:00:00 AM Sri Lanka standard time (Asia/Colombo).
     * Cron expression: second=0, minute=0, hour=4, day-of-month=*, month=*, day-of-week=*
     */
    @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Colombo")
    public void runDailyTaskGeneration() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        log.info("================================================================================");
        log.info("⏰ Recurring task scheduler started at 04:00 AM (Target Date: {})", today);
        log.info("================================================================================");

        try {
            Map<String, Object> stats = recurringTaskService.generateInstancesForDate(today, null);
            log.info("Recurring tasks checked: {}", stats.get("checked"));
            log.info("Instances created:       {}", stats.get("created"));
            log.info("Already existed:         {}", stats.get("alreadyExisted"));
            log.info("Skipped (not today):     {}", stats.get("skipped"));
            log.info("Scheduler completed successfully.");
        } catch (Exception e) {
            log.error("❌ Error occurred in recurring task scheduler: {}", e.getMessage(), e);
        }
        log.info("================================================================================");
    }
}
