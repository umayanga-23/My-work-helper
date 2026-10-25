package com.personal.workspace.repository;

import com.personal.workspace.entity.ClientInquiryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientInquiryRepository extends JpaRepository<ClientInquiryEntity, UUID> {

    List<ClientInquiryEntity> findAllByOrderByCreatedAtDesc();
}
