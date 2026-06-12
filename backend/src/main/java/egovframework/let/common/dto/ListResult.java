package egovframework.let.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ListResult<T> {

    private final List<T> resultList;
    private final int resultCnt;
}
