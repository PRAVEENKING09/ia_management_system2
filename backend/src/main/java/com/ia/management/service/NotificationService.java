package com.ia.management.service;

import com.ia.management.model.*;
import com.ia.management.repository.NotificationRepository;
import com.ia.management.repository.StudentRepository;
import com.ia.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
// Forced update to trigger recompile
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    public void createNotification(User user, String title, String message, Notification.NotificationType type,
            Long refId) {
        Notification note = new Notification();
        note.setUser(user);
        note.setTitle(title);
        note.setMessage(message);
        note.setType(type);
        note.setReferenceId(refId);
        notificationRepository.save(note);
    }

    public void notifyStudents(IAnnouncement announcement) {
        Subject subject = announcement.getSubject();
        // Assuming announcement applies to all sections for now
        List<Student> students = studentRepository.findByDepartmentAndSemester(subject.getDepartment(),
                subject.getSemester());

        for (Student student : students) {
            if (student.getUser() != null) {
                createNotification(
                        student.getUser(),
                        "New IA Scheduled: " + subject.getName(),
                        "CIE-" + announcement.getCieNumber() + " scheduled on " + announcement.getScheduledDate(),
                        Notification.NotificationType.IA_ANNOUNCEMENT,
                        announcement.getId());
            }
        }
    }

    public void notifyHOD(IAnnouncement announcement) {
        Subject subject = announcement.getSubject();
        String department = subject.getDepartment();

        // Find HOD for this department
        // Assuming associatedId stores the department name for HOD users
        List<User> users = userRepository.findAll(); // Optimization: Create findByRoleAndAssociatedId in Repo

        for (User user : users) {
            if (user.getRole() == User.Role.HOD && department.equalsIgnoreCase(user.getAssociatedId())) {
                createNotification(
                        user,
                        "New IA Scheduled: " + subject.getName(),
                        "Faculty " + announcement.getFaculty().getUsername() + " scheduled CIE-"
                                + announcement.getCieNumber() + " on " + announcement.getScheduledDate(),
                        Notification.NotificationType.IA_ANNOUNCEMENT,
                        announcement.getId());
            }
        }
    }

    public List<Notification> getUserNotifications(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public void markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId).orElse(null);
        if (n != null) {
            n.setIsRead(true);
            notificationRepository.save(n);
        }
    }
}
