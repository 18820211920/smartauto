package com.smartauto.common;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BaseEntity {
    private Long id;
    private Long tenantId;
    private Long projectId;
    private Long createBy;
    private LocalDateTime createTime;
    private Long updateBy;
    private LocalDateTime updateTime;
}