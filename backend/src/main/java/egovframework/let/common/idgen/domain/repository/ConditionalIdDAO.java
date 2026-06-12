package egovframework.let.common.idgen.domain.repository;

import egovframework.let.common.idgen.domain.model.ConditionalIdKey;
import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

@Repository("ConditionalIdDAO")
public class ConditionalIdDAO extends EgovAbstractMapper {

    public Long nextConditionalId(ConditionalIdKey key) {
        return selectOne("ConditionalIdDAO.nextConditionalId", key);
    }
}
