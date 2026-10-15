package com.civicshield.report;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hazard_reports")
public class HazardReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(nullable = false, length = 500)
    private String location;

    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String photoUrl;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false, length = 100)
    private String reporter;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public HazardReport() {}

    public HazardReport(String title, String category, String severity, String location,
                        String description, String photoUrl, Double latitude, Double longitude,
                        String status, String reporter, LocalDateTime createdAt) {
        this.title = title;
        this.category = category;
        this.severity = severity;
        this.location = location;
        this.description = description;
        this.photoUrl = photoUrl;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
        this.reporter = reporter;
        this.createdAt = createdAt;
    }

   @PrePersist
void onCreate() {
    if (createdAt == null) {
        createdAt = LocalDateTime.now(java.time.Clock.systemUTC());
    }

    if (status == null || status.isBlank()) {
        status = "Submitted";
    }
}

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getSeverity() { return severity; }
    public String getLocation() { return location; }
    public String getDescription() { return description; }
    public String getPhotoUrl() { return photoUrl; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getStatus() { return status; }
    public String getReporter() { return reporter; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setTitle(String title) { this.title = title; }
    public void setCategory(String category) { this.category = category; }
    public void setSeverity(String severity) { this.severity = severity; }
    public void setLocation(String location) { this.location = location; }
    public void setDescription(String description) { this.description = description; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public void setStatus(String status) { this.status = status; }
    public void setReporter(String reporter) { this.reporter = reporter; }
}
