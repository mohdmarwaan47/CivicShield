package com.civicshield.report;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class DemoData implements CommandLineRunner {
    private final HazardReportRepository repository;
    public DemoData(HazardReportRepository repository) { this.repository = repository; }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) return;
        LocalDateTime now = LocalDateTime.now();
        repository.save(new HazardReport("Deep pothole near bus stop", "Pothole", "High",
            "Anna Salai, Chennai", "A deep pothole is affecting two-wheeler traffic near the bus stop.",
            "", 13.0604, 80.2496, "Verified", "Kavya R.", now.minusHours(2)));
        repository.save(new HazardReport("Streetlight not working", "Broken streetlight", "Medium",
            "T. Nagar, Chennai", "The light has been off for three nights. The road is very dark after 8 PM.",
            "", 13.0418, 80.2337, "In Progress", "Arun S.", now.minusHours(5)));
        repository.save(new HazardReport("Broken pavement edge", "Damaged sidewalk", "Low",
            "Adyar, Chennai", "Uneven pavement near the crossing may cause trips.", "",
            13.0067, 80.2570, "Submitted", "Meera P.", now.minusDays(1)));
        repository.save(new HazardReport("Open manhole cover", "Open manhole", "Critical",
            "Velachery Main Road, Chennai", "An uncovered manhole close to the road edge. Please verify urgently.",
            "", 12.9750, 80.2210, "Verified", "Community member", now.minusMinutes(45)));
        repository.save(new HazardReport("Road debris after repair", "Road obstruction", "Medium",
            "Guindy, Chennai", "Construction debris is partially blocking the left lane.", "",
            13.0068, 80.2206, "Resolved", "Sanjay M.", now.minusDays(2)));
    }
}
