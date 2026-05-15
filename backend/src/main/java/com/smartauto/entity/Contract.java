package com.smartauto.entity;

import com.smartauto.common.BaseEntity;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class Contract extends BaseEntity {
    private Long customerId;
    private Long quoteId;
    private String contractNo;
    private String name;
    private BigDecimal amount;
    private String status;
    private LocalDate signDate;
    private String remark;
}