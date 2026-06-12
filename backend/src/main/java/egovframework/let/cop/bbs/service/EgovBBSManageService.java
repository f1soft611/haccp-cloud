package egovframework.let.cop.bbs.service;

import java.util.Map;
import egovframework.let.cop.bbs.domain.model.BoardVO;

public interface EgovBBSManageService {
    Map<String, Object> selectBoardArticles(BoardVO boardVO, String bbsMasterSe) throws Exception;
}
