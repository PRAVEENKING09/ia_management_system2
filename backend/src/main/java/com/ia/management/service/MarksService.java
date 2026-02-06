package com.ia.management.service;

import com.ia.management.model.IAMark;
import com.ia.management.model.Student;
import com.ia.management.model.Subject;
import com.ia.management.repository.IAMarkRepository;
import com.ia.management.repository.StudentRepository;
import com.ia.management.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MarksService {

    @Autowired
    private IAMarkRepository iaMarkRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    public List<IAMark> getMarksForSubject(Long subjectId) {
        // In a real app, might want to filter by semester/section of the subject logic
        // For now, return all marks for this subject
        return iaMarkRepository.findAll(); // Simplified; better to filter by student list + subject
    }

    public List<IAMark> getMarksByStudentAndSubject(Long studentId, Long subjectId) {
        return iaMarkRepository.findByStudentIdAndSubjectId(studentId, subjectId);
    }

    @Transactional
    public IAMark updateMark(Long studentId, Long subjectId, String iaTypeStr, Double co1, Double co2) {
        IAMark.IAType iaType = IAMark.IAType.valueOf(iaTypeStr);
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Optional<IAMark> existing = iaMarkRepository.findByStudentIdAndSubjectIdAndIaType(studentId, subjectId, iaType);

        IAMark mark;
        if (existing.isPresent()) {
            mark = existing.get();
        } else {
            mark = new IAMark();
            mark.setStudent(student);
            mark.setSubject(subject);
            mark.setIaType(iaType);
        }

        mark.setCo1Score(co1);
        mark.setCo2Score(co2);

        // Auto-calculate total
        double total = (co1 != null ? co1 : 0) + (co2 != null ? co2 : 0);

        // Clamp to Max
        int maxTotal = subject.getTotalMaxMarks();
        if (total > maxTotal)
            total = maxTotal;

        mark.setTotalScore(total);

        return iaMarkRepository.save(mark);
    }

    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @Autowired
    private com.ia.management.repository.UserRepository userRepository; // Inject UserRepository

    public List<IAMark> getMyMarks(String username) {
        com.ia.management.model.User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != com.ia.management.model.User.Role.STUDENT) {
            throw new RuntimeException("User is not a student");
        }

        // Student RegNo is stored in associatedId
        String regNo = user.getAssociatedId();
        Student student = studentRepository.findByRegNo(regNo)
                .orElseThrow(() -> new RuntimeException("Student record not found for RegNo: " + regNo));

        return iaMarkRepository.findByStudentId(student.getId());
    }
}
