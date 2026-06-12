package egovframework.let.common.idgen.service;

public interface EgovConditionalIdService {

    String getNextStringId(String tableName, String condition1, String condition2, String prefix, int cipers, char fillChar) throws Exception;
}
