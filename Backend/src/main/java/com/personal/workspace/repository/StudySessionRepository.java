package com.personal.workspace.repository;

import com.personal.workspace.entity.StudySessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySessionEntity, UUID> {
    List<StudySessionEntity> findByUserIdOrderBySessionDateDescCreatedAtDesc(UUID userId);
    List<StudySessionEntity> findByUserIdAndSkillId(UUID userId, UUID skillId);
    
    @Query("SELECT DISTINCT s.sessionDate FROM StudySessionEntity s WHERE s.userId = :userId ORDER BY s.sessionDate DESC")
    List<LocalDate> findDistinctSessionDatesByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(s.durationMinutes), 0) FROM StudySessionEntity s WHERE s.userId = :userId")
    Long getTotalStudyMinutesByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(s.durationMinutes), 0) FROM StudySessionEntity s WHERE s.userId = :userId AND s.sessionDate = :date")
    Long getTodayStudyMinutesByUserId(UUID userId, LocalDate date);
}
