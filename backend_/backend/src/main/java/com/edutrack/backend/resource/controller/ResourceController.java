package com.edutrack.backend.resource.controller;

import com.edutrack.backend.resource.entity.Resource;
import com.edutrack.backend.resource.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @PostMapping("/add")
    public Resource addResource(@Valid @RequestBody Resource resource) {
        return resourceService.saveResource(resource);
    }

    @GetMapping("/all")
    public List<Resource> getAll() {
        return resourceService.getAllResources();
    }

    @GetMapping("/{id}")
    public Resource getById(@PathVariable Long id) {
        return resourceService.getResourceById(id);
    }

    @PutMapping("/{id}")
    public Resource updateResource(@PathVariable Long id, @Valid @RequestBody Resource details) {
        return resourceService.updateResource(id, details);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return "Deleted successfully";
    }

    @GetMapping("/search")
    public List<Resource> searchResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String status) {

        if (type != null) {
            return resourceService.getByType(type);
        }
        if (minCapacity != null) {
            return resourceService.getByCapacity(minCapacity);
        }
        if (location != null) {
            return resourceService.getByLocation(location);
        }
        if (status != null) {
            return resourceService.getByStatus(status);
        }

        return resourceService.getAllResources();
    }
}
