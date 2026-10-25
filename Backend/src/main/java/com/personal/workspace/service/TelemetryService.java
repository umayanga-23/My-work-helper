package com.personal.workspace.service;

import com.personal.workspace.dto.ClientInquiryRequest;
import com.personal.workspace.dto.DemoVisitorRequest;
import com.personal.workspace.entity.ClientInquiryEntity;
import com.personal.workspace.entity.DemoVisitorEntity;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.ClientInquiryRepository;
import com.personal.workspace.repository.DemoVisitorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TelemetryService {

    private static final Logger log = LoggerFactory.getLogger(TelemetryService.class);

    private final DemoVisitorRepository demoVisitorRepository;
    private final ClientInquiryRepository clientInquiryRepository;

    public TelemetryService(DemoVisitorRepository demoVisitorRepository,
                            ClientInquiryRepository clientInquiryRepository) {
        this.demoVisitorRepository = demoVisitorRepository;
        this.clientInquiryRepository = clientInquiryRepository;
    }

    @Transactional
    public DemoVisitorEntity recordDemoVisitor(DemoVisitorRequest request, String ipAddress, String countryHeader) {
        String cleanIp = ipAddress != null ? ipAddress.split(",")[0].trim() : "Unknown";
        String country = countryHeader != null && !countryHeader.isBlank() ? countryHeader : "Global";

        DemoVisitorEntity entity = new DemoVisitorEntity(
                request.getName().trim(),
                cleanIp,
                country,
                null,
                request.getDeviceType(),
                request.getBrowser(),
                request.getOs()
        );

        DemoVisitorEntity saved = demoVisitorRepository.save(entity);
        log.info("📊 [DEMO TELEMETRY] Visitor logged: '{}' | Device: {} | IP: {} | Country: {}",
                saved.getName(), saved.getDeviceType(), saved.getIpAddress(), saved.getCountry());
        return saved;
    }

    @Transactional
    public ClientInquiryEntity submitInquiry(ClientInquiryRequest request) {
        ClientInquiryEntity entity = new ClientInquiryEntity(
                request.getVisitorName().trim(),
                request.getEmailOrPhone().trim(),
                request.getRequirement().trim()
        );

        ClientInquiryEntity saved = clientInquiryRepository.save(entity);
        log.info("💼 [CLIENT INQUIRY] New Customization Request received from: '{}' ({})",
                saved.getVisitorName(), saved.getEmailOrPhone());
        return saved;
    }

    public List<DemoVisitorEntity> getAllVisitors() {
        return demoVisitorRepository.findAllByOrderByVisitedAtDesc();
    }

    public List<ClientInquiryEntity> getAllInquiries() {
        return clientInquiryRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public ClientInquiryEntity updateInquiryStatus(UUID id, String status, String notes) {
        ClientInquiryEntity entity = clientInquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry not found with id: " + id));

        if (status != null && !status.isBlank()) {
            entity.setStatus(status.toUpperCase());
        }
        if (notes != null) {
            entity.setNotes(notes);
        }
        return clientInquiryRepository.save(entity);
    }
}
