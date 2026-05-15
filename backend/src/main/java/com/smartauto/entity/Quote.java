package com.smartauto.entity;

import com.smartauto.common.BaseEntity;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class Quote extends BaseEntity {
    private Long customerId;
    private String quoteNo;
    private String name;
    private BigDecimal amount;
    private String status;
    private String version;
    private String validDate;
    private String remark;
}