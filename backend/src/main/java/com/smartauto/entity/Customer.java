package com.smartauto.entity;

import com.smartauto.common.BaseEntity;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class Customer extends BaseEntity {
    private String name;
    private String contact;
    private String phone;
    private String email;
    private String industry;
    private String level;
    private String address;
    private String remark;
}