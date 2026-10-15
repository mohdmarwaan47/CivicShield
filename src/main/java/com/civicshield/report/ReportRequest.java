package com.civicshield.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReportRequest {
    @NotBlank @Size(max = 100)
    public String title;
    @NotBlank
    public String category;
    @NotBlank
    public String severity;
    @NotBlank @Size(max = 500)
    public String location;
    @Size(max = 1000)
    public String description;
    @Size(max = 500)
    public String photoUrl;
    public Double latitude;
    public Double longitude;
    @Size(max = 100)
    public String reporter;
}
