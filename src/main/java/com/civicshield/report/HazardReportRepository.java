package com.civicshield.report;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HazardReportRepository extends JpaRepository<HazardReport, Long> {
    List<HazardReport> findAllByOrderByCreatedAtDesc();
}
