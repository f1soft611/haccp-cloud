package egovframework.let.cop.bbs.domain.model;

import egovframework.com.cmm.ComDefaultVO;

public class BoardVO extends ComDefaultVO {

    private String bbsId;
    private String bbsNm;
    private String bbsMasterSe;

    public String getBbsId() { return bbsId; }
    public void setBbsId(String bbsId) { this.bbsId = bbsId; }

    public String getBbsNm() { return bbsNm; }
    public void setBbsNm(String bbsNm) { this.bbsNm = bbsNm; }

    public String getBbsMasterSe() { return bbsMasterSe; }
    public void setBbsMasterSe(String bbsMasterSe) { this.bbsMasterSe = bbsMasterSe; }
}
