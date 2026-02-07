package com.ia.management.service;

import com.ia.management.model.IAnnouncement;
import com.ia.management.model.Subject;
import com.ia.management.model.User;
import com.ia.management.repository.IAnnouncementRepository;
import com.ia.management.repository.SubjectRepository;
import com.ia.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
// Forced update to trigger recompile
public class IAnnouncementService {

    @Autowired
    private IAnnouncementRepository iaRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Transactional
    public IAnnouncement createAnnouncement(Long subjectId, String username, IAnnouncement announcement) {
        User faculty = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        announcement.setFaculty(faculty);
        announcement.setSubject(subject);

        IAnnouncement saved = iaRepository.save(announcement);

        // Broadcast notifications
        notificationService.notifyStudents(saved);
        notificationService.notifyHOD(saved);

        return saved;
    }

    public List<IAnnouncement> getFacultyAnnouncements(String username) {
        User faculty = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return iaRepository.findByFaculty(faculty);
    }

    public List<IAnnouncement> getStudentAnnouncements(String username) {
        // Find student subjects
        // Simplified: Fetch based on Dept/Sem matching student
        // Real implementation should check enrollment
        // But for now, we find all active announcements for the student's dept/sem

        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        // Need to find Student profile to get Dept/Sem
        // Assuming associatedId is RegNo, find student
        // Or simpler: We don't have direct access here without StudentRepo dependency
        // or adding it to User

        // Let's rely on Subject IDs.
        // Logic: Find IDs of subjects relevant to student
        // This part needs StudentRepository access.
        // For now returning empty or handling logic in Controller where we have access
        return List.of();
    }

    public List<IAnnouncement> getAnnouncementsForSubjects(List<Long> subjectIds) {
        return iaRepository.findBySubjectIdInAndScheduledDateAfterOrderByScheduledDateAsc(subjectIds,
                LocalDate.now().minusDays(1));
    }

    public List<IAnnouncement> getDepartmentAnnouncements(String department) {
        return iaRepository.findBySubject_DepartmentAndScheduledDateAfterOrderByScheduledDateAsc(department,
                LocalDate.now().minusDays(1));
    }
}
