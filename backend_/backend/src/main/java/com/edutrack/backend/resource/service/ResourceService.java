package com.edutrack.backend.resource.service;

import com.edutrack.backend.resource.entity.Resource;
import com.edutrack.backend.resource.repository.ResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public Resource saveResource(Resource resource) {
        return resourceRepository.save(resource);
    }

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public Resource getResourceById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found with id: " + id));
    }

    public Resource updateResource(Long id, Resource details) {
        Resource existing = getResourceById(id);
        existing.setName(details.getName());
        existing.setType(details.getType());
        existing.setCapacity(details.getCapacity());
        existing.setLocation(details.getLocation());
        existing.setStatus(details.getStatus());
        existing.setAvailabilityWindows(details.getAvailabilityWindows());
        return resourceRepository.save(existing);
    }

    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    public List<Resource> getByType(String type) {
        return resourceRepository.findByType(type);
    }

    public List<Resource> getByStatus(String status) {
        return resourceRepository.findByStatus(status);
    }

    public List<Resource> getByCapacity(Integer capacity) {
        return resourceRepository.findByCapacityGreaterThanEqual(capacity);
    }

    public List<Resource> getByLocation(String location) {
        return resourceRepository.findByLocationContainingIgnoreCase(location);
    }
}
