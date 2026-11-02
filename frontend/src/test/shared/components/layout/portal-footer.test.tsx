import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { appTheme } from '../../../../app/theme.ts';
import { PortalFooter } from '../../../../shared/components/layout/PortalFooter.tsx';

describe('PortalFooter', () => {
  it('renders full company footer information from policy copy', () => {
    render(
      <ThemeProvider theme={appTheme}>
        <PortalFooter />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('portal-footer')).toBeInTheDocument();
    expect(screen.queryByText('FoodLink Cloud Portal')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('portal-footer-company-info'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/TEL 031\)5183-5341\(대표\) \| FAX 031\)5183-5340/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/E-MAIL : info@f1soft\.co\.kr \| 대표: 오승호/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /COPYRIGHT\(C\) F1soft CO\.,LTD\. ALL RIGHTS RESERVED\./,
      ),
    ).toBeInTheDocument();

    expect(screen.getByAltText('F1FoodLink')).toHaveAttribute(
      'src',
      '/f1foodlink_midd.png',
    );
  });

  it('shows contact info on the same line as the head office address', () => {
    render(
        <ThemeProvider theme={appTheme}>
          <PortalFooter />
        </ThemeProvider>,
    );

    expect(
        screen.getByText(/FAX 031\)5183-5340 E-MAIL : info@f1soft\.co\.kr/),
    ).toBeInTheDocument();
    expect(
        screen.getByTestId('portal-footer-company-info').children,
    ).toHaveLength(3);
  });
});
