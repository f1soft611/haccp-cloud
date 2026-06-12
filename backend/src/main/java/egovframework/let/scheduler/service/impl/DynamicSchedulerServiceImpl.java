package egovframework.let.scheduler.service.impl;

import egovframework.let.scheduler.domain.repository.SchedulerConfigDAO;
import egovframework.let.scheduler.domain.model.SchedulerConfig;
import egovframework.let.scheduler.domain.model.SchedulerHistory;
import egovframework.let.scheduler.service.DynamicSchedulerService;
import egovframework.let.scheduler.service.SchedulerHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import javax.annotation.PreDestroy;
import java.lang.reflect.Method;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * 동적 스케쥴러 관리 서비스 구현체
 * @author AI Assistant
 * @since 2025.10.23
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DynamicSchedulerServiceImpl implements DynamicSchedulerService, SchedulingConfigurer {

    private final SchedulerConfigDAO schedulerConfigDAO;
    private final SchedulerHistoryService schedulerHistoryService;
    private final ApplicationContext applicationContext;
    
    private ThreadPoolTaskScheduler taskScheduler;
    private final Map<Long, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();
    private volatile boolean isInitialized = false;

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10);
        scheduler.setThreadNamePrefix("dynamic-scheduler-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(30);
        scheduler.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        scheduler.initialize();
        this.taskScheduler = scheduler;
        taskRegistrar.setTaskScheduler(scheduler);
        log.info("TaskScheduler 설정 완료 - PoolSize: 10, GracefulShutdown: 30초");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            log.info("=== 스케쥴러 초기화 시작 (ApplicationReadyEvent) ===");
            
            if (taskScheduler == null) {
                log.error("TaskScheduler 초기화 실패 - taskScheduler가 null입니다.");
                log.error("configureTasks()가 실행되지 않았을 수 있습니다.");
                isInitialized = false;
                return;
            }
            
            // ThreadPoolTaskScheduler 상태 확인
            if (taskScheduler.getScheduledExecutor() == null) {
                log.error("TaskScheduler의 Executor가 초기화되지 않았습니다.");
                isInitialized = false;
                return;
            }
            
            log.info("TaskScheduler 상태: 정상 (PoolSize: {})", 
                ((ThreadPoolTaskScheduler)taskScheduler).getPoolSize());
            
            initializeSchedulers();
            isInitialized = true;
            log.info("=== 스케쥴러 초기화 완료: {} 개의 스케쥴러 등록됨 ===", scheduledTasks.size());
        } catch (Exception e) {
            log.error("스케쥴러 초기화 실패", e);
            isInitialized = false;
        }
    }
    
    @PreDestroy
    public void destroy() {
        try {
            log.info("=== 스케쥴러 종료 시작 ===");
            
            // 모든 스케쥴 작업 취소
            scheduledTasks.values().forEach(task -> {
                if (task != null && !task.isCancelled()) {
                    task.cancel(false);
                }
            });
            scheduledTasks.clear();
            
            // TaskScheduler 종료
            if (taskScheduler != null) {
                taskScheduler.shutdown();
                // 종료 완료 대기
                if (taskScheduler.getScheduledExecutor() != null) {
                    taskScheduler.getScheduledExecutor().awaitTermination(30, TimeUnit.SECONDS);
                }
            }
            
            isInitialized = false;
            log.info("=== 스케쥴러 정상 종료 완료 ===");
        } catch (Exception e) {
            log.error("스케쥴러 종료 중 오류 발생", e);
        }
    }

    @Override
    public void initializeSchedulers() throws Exception {
        List<SchedulerConfig> schedulers = schedulerConfigDAO.selectEnabledSchedulers();
        log.info("활성화된 스케쥴러 개수: {}", schedulers.size());
        
        int successCount = 0;
        for (SchedulerConfig scheduler : schedulers) {
            try {
                scheduleTask(scheduler);
                successCount++;
            } catch (Exception e) {
                log.error("스케쥴러 등록 실패: {} - {}", scheduler.getSchedulerName(), e.getMessage());
            }
        }
        
        log.info("스케쥴러 등록 결과: 성공 {}/{}", successCount, schedulers.size());
    }

    @Override
    public void restartSchedulers() throws Exception {
        log.info("=== 스케쥴러 재시작 시작 ===");
        
        // 모든 기존 스케쥴 작업 취소
        int cancelledCount = 0;
        for (ScheduledFuture<?> task : scheduledTasks.values()) {
            if (task != null && !task.isCancelled()) {
                task.cancel(false);
                cancelledCount++;
            }
        }
        scheduledTasks.clear();
        log.info("기존 스케쥴러 {} 개 취소됨", cancelledCount);
        
        // TaskScheduler 상태 확인
        if (taskScheduler == null || taskScheduler.getScheduledExecutor() == null 
                || taskScheduler.getScheduledExecutor().isShutdown()) {
            log.warn("TaskScheduler가 종료되어 있습니다. 재생성합니다.");
            
            // TaskScheduler 재생성
            ThreadPoolTaskScheduler newScheduler = new ThreadPoolTaskScheduler();
            newScheduler.setPoolSize(10);
            newScheduler.setThreadNamePrefix("dynamic-scheduler-");
            newScheduler.setWaitForTasksToCompleteOnShutdown(true);
            newScheduler.setAwaitTerminationSeconds(30);
            newScheduler.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
            newScheduler.initialize();
            this.taskScheduler = newScheduler;
            log.info("TaskScheduler 재생성 완료");
        }
        
        // 활성화된 스케쥴러 다시 등록
        initializeSchedulers();
        isInitialized = true;
        
        log.info("=== 스케쥴러 재시작 완료: {} 개 등록됨 ===", scheduledTasks.size());
    }

    private void scheduleTask(SchedulerConfig config) {
        if (taskScheduler == null) {
            log.warn("TaskScheduler가 초기화되지 않았습니다.");
            return;
        }

        try {
            // 자동 스케쥴러는 실행 시점 기준 날짜를 사용해야 한다.
            Runnable task = createTaskRunnable(config);
            CronTrigger cronTrigger = new CronTrigger(config.getCronExpression());
            ScheduledFuture<?> scheduledTask = taskScheduler.schedule(task, cronTrigger);
            scheduledTasks.put(config.getSchedulerId(), scheduledTask);
            
            log.info("스케쥴러 등록 완료: {} (CRON: {})", config.getSchedulerName(), config.getCronExpression());
        } catch (Exception e) {
            log.error("스케쥴러 등록 실패: {}", config.getSchedulerName(), e);
        }
    }

    private Runnable createTaskRunnable(SchedulerConfig config) {
        return () -> {
            String today = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
            createTaskRunnable(config, today, today).run();
        };
    }

    private Runnable createTaskRunnable(SchedulerConfig config, String fromDate, String toDate) {
        return () -> {
            SchedulerHistory history = new SchedulerHistory();
            history.setSchedulerId(config.getSchedulerId());
            history.setSchedulerName(config.getSchedulerName());
            history.setStatus("RUNNING");

            long startTime = System.currentTimeMillis();
            history.setStartTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
                    .format(new Date(startTime)));

            // 히스토리 시작 기록
            try {
                Long historyId = schedulerHistoryService.insertSchedulerHistory(history);
                log.debug("스케쥴러 이력 등록 완료: historyId={}, schedulerName={}", historyId, config.getSchedulerName());
                
                // historyId가 null인 경우 에러 처리
                if (historyId == null) {
                    log.error("스케쥴러 이력 등록 후 historyId가 null입니다: {}", config.getSchedulerName());
                    return; // 이력 ID가 없으면 실행 중단
                }
            } catch (Exception e) {
                log.error("스케쥴러 이력 등록 실패: {}", config.getSchedulerName(), e);
                return; // 이력 등록 실패 시 실행 중단
            }

            try {
                // 스케쥴러 실행
                executeJob(config, fromDate, toDate);

                // ✅ 성공 처리
                long endTime = System.currentTimeMillis();
                history.setStatus("SUCCESS");
                history.setEndTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
                        .format(new Date(endTime)));
                history.setExecutionTimeMs(endTime - startTime);
                history.setErrorMessage(null);
                history.setErrorStackTrace(null);

                log.info("스케쥴러 실행 완료: {} ({}ms)",
                        config.getSchedulerName(), endTime - startTime);

            } catch (Exception e) {
                // ❌ 실패 처리
                long endTime = System.currentTimeMillis();
                history.setStatus("FAILED");
                history.setEndTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
                        .format(new Date(endTime)));
                history.setExecutionTimeMs(endTime - startTime);

                // ✨ 개선: 상세 에러 정보 저장
                history.setErrorFromException(e);

                log.error("스케쥴러 실행 실패: {} ({}ms)",
                        config.getSchedulerName(), endTime - startTime, e);

            } finally {
                // 히스토리 업데이트
                try {
                    log.debug("스케쥴러 이력 업데이트 시작 - historyId={}, status={}, schedulerName={}", 
                            history.getHistoryId(), history.getStatus(), config.getSchedulerName());
                    
                    if (history.getHistoryId() == null) {
                        log.error("업데이트 시도 시 historyId가 null입니다 - schedulerName={}", config.getSchedulerName());
                    } else {
                        schedulerHistoryService.updateSchedulerHistory(history);
                        log.debug("스케쥴러 이력 업데이트 완료: historyId={}", history.getHistoryId());
                    }
                } catch (Exception e) {
                    log.error("스케쥴러 이력 업데이트 실패 - History ID: {}, Scheduler: {}",
                            history.getHistoryId(), config.getSchedulerName(), e);

                    // ✨ 개선: 업데이트 실패 시 재시도
                    retryUpdateHistory(history, 3);
                }
            }
        };
    }

    /**
     * 히스토리 업데이트 재시도 로직
     */
    private void retryUpdateHistory(SchedulerHistory history, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                Thread.sleep(1000 * (i + 1)); // 1초, 2초, 3초 대기
                schedulerHistoryService.updateSchedulerHistory(history);
                log.info("스케쥴러 이력 업데이트 재시도 성공: {} ({}회차)",
                        history.getSchedulerName(), i + 1);
                return;
            } catch (Exception e) {
                log.warn("스케쥴러 이력 업데이트 재시도 실패: {} ({}회차)",
                        history.getSchedulerName(), i + 1);
            }
        }
        log.error("스케쥴러 이력 업데이트 최종 실패: {}", history.getSchedulerName());
    }

    private void executeJob(SchedulerConfig config, String fromDate, String toDate) throws Exception {
        String jobClassName = config.getJobClassName();
        log.info("스케쥴러 작업 실행: {} - {} (기간: {} ~ {})", config.getSchedulerName(), jobClassName, fromDate, toDate);

        try {
            // jobClassName 형식:
            // 1. egovframework.let.scheduler.service.ErpToMesInterfaceService.executeInterface (전체 경로)
            // 2. ErpToMesInterfaceService.executeInterface (짧은 형식)
            // 3. egovframework.let.scheduler.service.ErpToMesInterfaceService (클래스만)
            // 4. ErpToMesInterfaceService (짧은 클래스명만)

            String serviceName;
            String methodName = null;

            // 메서드명이 포함된 경우 분리
            if (jobClassName.contains(".") &&
                    Character.isLowerCase(jobClassName.charAt(jobClassName.lastIndexOf('.') + 1))) {
                int lastDotIndex = jobClassName.lastIndexOf('.');
                serviceName = jobClassName.substring(0, lastDotIndex);
                methodName = jobClassName.substring(lastDotIndex + 1);
            } else {
                serviceName = jobClassName;
            }

            // 클래스 이름에서 서비스 빈 이름 추출
            String beanName = getBeanNameFromClassName(serviceName);

            // Spring 컨텍스트에서 서비스 빈 조회
            Object serviceBean = null;
            try {
                serviceBean = applicationContext.getBean(beanName);
            } catch (Exception e) {
                throw new IllegalArgumentException("서비스 빈을 찾을 수 없습니다: " + beanName + " (원본: " + jobClassName + ")", e);
            }

            // 메서드 실행
            if (methodName != null && !methodName.isEmpty()) {
                // 특정 메서드 호출 - 날짜 파라미터가 있는 메서드 먼저 시도
                try {
                    Method method = serviceBean.getClass().getMethod(methodName, String.class, String.class);
                    method.invoke(serviceBean, fromDate, toDate);
                    log.info("메서드 실행 완료 (날짜 파라미터): {}.{}({}, {})", beanName, methodName, fromDate, toDate);
                } catch (NoSuchMethodException e) {
                    // 날짜 파라미터가 없는 메서드 시도
                    Method method = serviceBean.getClass().getMethod(methodName);
                    method.invoke(serviceBean);
                    log.info("메서드 실행 완료: {}.{}", beanName, methodName);
                }
            } else {
                // executeInterface 메서드를 기본으로 호출
                try {
                    Method executeMethod = serviceBean.getClass().getMethod("executeInterface", String.class, String.class);
                    executeMethod.invoke(serviceBean, fromDate, toDate);
                    log.info("executeInterface 메서드 실행 완료 (날짜 파라미터): {}", beanName);
                } catch (NoSuchMethodException e) {
                    // 날짜 파라미터가 없는 executeInterface 시도
                    try {
                        Method executeMethod = serviceBean.getClass().getMethod("executeInterface");
                        executeMethod.invoke(serviceBean);
                        log.info("executeInterface 메서드 실행 완료: {}", beanName);
                    } catch (NoSuchMethodException e2) {
                        // execute 메서드 시도
                        try {
                            Method executeMethod = serviceBean.getClass().getMethod("execute");
                            executeMethod.invoke(serviceBean);
                            log.info("execute 메서드 실행 완료: {}", beanName);
                        } catch (NoSuchMethodException e3) {
                            throw new IllegalArgumentException(
                                    "서비스에 executeInterface() 또는 execute() 메서드가 없습니다: " + beanName);
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error("스케쥴러 작업 실행 실패: {}", config.getSchedulerName(), e);
            throw e;
        }
    }

    /**
     * 클래스 전체 경로 또는 짧은 클래스명에서 Spring Bean 이름을 추출
     * 예1: egovframework.let.scheduler.service.ErpToMesInterfaceService -> erpToMesInterfaceService
     * 예2: ErpToMesInterfaceService -> erpToMesInterfaceService
     */
    private String getBeanNameFromClassName(String className) {
        // 클래스 전체 경로에서 마지막 클래스명만 추출
        String simpleClassName = className.contains(".")
                ? className.substring(className.lastIndexOf('.') + 1)
                : className;

        // 첫 글자를 소문자로 변환하여 Bean 이름 생성
        return Character.toLowerCase(simpleClassName.charAt(0)) + simpleClassName.substring(1);
    }

    @Override
    public void executeSchedulerManually(Long schedulerId, String fromDate, String toDate) throws Exception {
        log.info("스케쥴러 수동 실행 시작: schedulerId={}, 기간: {} ~ {}", schedulerId, fromDate, toDate);
        
        // 스케쥴러 설정 조회
        SchedulerConfig config = schedulerConfigDAO.selectSchedulerDetail(schedulerId);
        if (config == null) {
            throw new IllegalArgumentException("스케쥴러를 찾을 수 없습니다: " + schedulerId);
        }
        
        // 날짜가 null인 경우 오늘 날짜로 설정
        if (fromDate == null || fromDate.isEmpty()) {
            fromDate = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        }
        if (toDate == null || toDate.isEmpty()) {
            toDate = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        }
        
        final String finalFromDate = fromDate;
        final String finalToDate = toDate;
        
        // TaskScheduler를 사용하여 비동기로 실행
        if (taskScheduler != null) {
            Runnable task = createTaskRunnable(config, finalFromDate, finalToDate);
            taskScheduler.schedule(task, new Date());
        } else {
            log.warn("TaskScheduler가 초기화되지 않아 동기로 실행합니다.");
            Runnable task = createTaskRunnable(config, finalFromDate, finalToDate);
            task.run();
        }
        
        log.info("스케쥴러 수동 실행 요청 완료: {}", config.getSchedulerName());
    }

    @Override
    public Map<String, Object> getSchedulerStatus() {
        Map<String, Object> status = new java.util.HashMap<>();
        
        // 초기화 상태
        status.put("isInitialized", isInitialized);
        
        // TaskScheduler 상태
        boolean taskSchedulerHealthy = false;
        String taskSchedulerStatus = "UNKNOWN";
        
        if (taskScheduler != null) {
            if (taskScheduler.getScheduledExecutor() != null) {
                if (!taskScheduler.getScheduledExecutor().isShutdown()) {
                    taskSchedulerHealthy = true;
                    taskSchedulerStatus = "RUNNING";
                } else {
                    taskSchedulerStatus = "SHUTDOWN";
                }
            } else {
                taskSchedulerStatus = "NOT_INITIALIZED";
            }
        } else {
            taskSchedulerStatus = "NULL";
        }
        
        status.put("taskSchedulerHealthy", taskSchedulerHealthy);
        status.put("taskSchedulerStatus", taskSchedulerStatus);
        
        // 등록된 스케줄러 작업 수
        status.put("registeredTasksCount", scheduledTasks.size());
        
        // 활성 작업 수 (취소되지 않은 작업)
        long activeTasksCount = scheduledTasks.values().stream()
                .filter(task -> task != null && !task.isCancelled() && !task.isDone())
                .count();
        status.put("activeTasksCount", activeTasksCount);
        
        // 전체 상태
        String overallStatus;
        if (isInitialized && taskSchedulerHealthy && activeTasksCount > 0) {
            overallStatus = "HEALTHY";
        } else if (isInitialized && taskSchedulerHealthy) {
            overallStatus = "INITIALIZED_NO_TASKS";
        } else if (!isInitialized) {
            overallStatus = "NOT_INITIALIZED";
        } else {
            overallStatus = "UNHEALTHY";
        }
        status.put("status", overallStatus);
        
        // 마지막 확인 시간
        status.put("checkTime", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        
        return status;
    }
}
