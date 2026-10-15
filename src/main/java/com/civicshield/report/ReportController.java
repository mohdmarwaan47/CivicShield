package com.civicshield.report;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ReportController {
    private final HazardReportRepository repository;
    private static final Set<String> CATEGORIES = Set.of("Pothole", "Broken streetlight", "Damaged sidewalk", "Road obstruction", "Open manhole", "Other");
    private static final Set<String> SEVERITIES = Set.of("Low", "Medium", "High", "Critical");
    private static final Set<String> STATUSES = Set.of("Submitted", "Verified", "In Progress", "Resolved");

    public ReportController(HazardReportRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/reports")
    public List<HazardReport> allReports() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

  
@PostMapping("/reports")
public ResponseEntity<HazardReport> create(
        @Valid @RequestBody ReportRequest request) {

    if (!CATEGORIES.contains(request.category)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Choose a valid category.");
    }

    if (!SEVERITIES.contains(request.severity)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Choose a valid severity.");
    }

    HazardReport report = new HazardReport(
        request.title.trim(),
        request.category,
        request.severity,
        request.location.trim(),
        request.description == null ? "" : request.description.trim(),
        request.photoUrl == null ? "" : request.photoUrl.trim(),
        request.latitude,
        request.longitude,
        "Submitted",
        request.reporter == null || request.reporter.isBlank()
            ? "Community member" : request.reporter.trim(),
        LocalDateTime.now()
    );

    try {
        HazardReport saved = repository.saveAndFlush(report);

        if (saved.getId() == null) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Report could not be confirmed as saved.");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);

    } catch (DataAccessException ex) {
        throw new ResponseStatusException(
            HttpStatus.SERVICE_UNAVAILABLE,
            "Report could not be saved. Please try again.",
            ex
        );
    }
}
    
    @PatchMapping("/reports/{id}/status")
    public HazardReport updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "");
        if (!STATUSES.contains(status)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status.");
        HazardReport report = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found."));
        report.setStatus(status);
        return repository.save(report);
    }

    @DeleteMapping("/reports/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found.");
        repository.deleteById(id);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        List<HazardReport> reports = repository.findAll();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", reports.size());
        result.put("open", reports.stream().filter(r -> !"Resolved".equals(r.getStatus())).count());
        result.put("critical", reports.stream().filter(r -> "Critical".equals(r.getSeverity()) && !"Resolved".equals(r.getStatus())).count());
        result.put("resolved", reports.stream().filter(r -> "Resolved".equals(r.getStatus())).count());
        result.put("resolutionRate", reports.isEmpty() ? 0 : Math.round(reports.stream().filter(r -> "Resolved".equals(r.getStatus())).count() * 100.0 / reports.size()));
        return result;
    }
}
