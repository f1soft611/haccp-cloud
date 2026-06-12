package egovframework.let.cop.bbs.service.impl;

import java.util.Collections;
import java.util.Map;

import org.springframework.stereotype.Service;

import egovframework.let.cop.bbs.domain.model.BoardVO;
import egovframework.let.cop.bbs.service.EgovBBSManageService;

@Service("EgovBBSManageService")
public class EgovBBSManageServiceImpl implements EgovBBSManageService {

    @Override
    public Map<String, Object> selectBoardArticles(BoardVO boardVO, String bbsMasterSe) throws Exception {
        return Collections.singletonMap("resultList", Collections.emptyList());
    }
}
