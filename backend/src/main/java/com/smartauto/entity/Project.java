package com.smartauto.entity;

import com.smartauto.common.BaseEntity;
import lombok.Data;

@Data
public class Project extends BaseEntity {
    private Long contractId;
    private Long customerId;
    private String projectNo;
    private String name;
    private String status;
    private Integer plannedDays;
    private String startDate;
    private String endDate;
    private String remark;
}