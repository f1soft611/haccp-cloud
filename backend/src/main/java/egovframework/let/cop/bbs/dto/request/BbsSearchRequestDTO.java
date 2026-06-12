package egovframework.let.cop.bbs.dto.request;

public class BbsSearchRequestDTO {

    private int pageIndex = 1;
    private String searchCnd;
    private String searchWrd;

    public int getPageIndex() { return pageIndex; }
    public void setPageIndex(int pageIndex) { this.pageIndex = pageIndex; }

    public String getSearchCnd() { return searchCnd; }
    public void setSearchCnd(String searchCnd) { this.searchCnd = searchCnd; }

    public String getSearchWrd() { return searchWrd; }
    public void setSearchWrd(String searchWrd) { this.searchWrd = searchWrd; }
}
