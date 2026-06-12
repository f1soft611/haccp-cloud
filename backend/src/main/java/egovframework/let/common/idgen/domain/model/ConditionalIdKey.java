package egovframework.let.common.idgen.domain.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConditionalIdKey {

    private String tableName;
    private String condition1;
    private String condition2;
}
