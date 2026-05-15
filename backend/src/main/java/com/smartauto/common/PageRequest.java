package com.smartauto.common;

import lombok.Data;

@Data
public class PageRequest {
    private int page = 1;
    private int pageSize = 20;
    private String sortBy;
    private String sortOrder = "desc";
}