
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';
import { type CartItem } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';

interface AbandonedCartEmailProps {
  customerFirstName: string;
  cartItems: CartItem[];
  cartTotal: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

const AbandonedCartEmail = ({
  customerFirstName,
  cartItems,
  cartTotal,
}: AbandonedCartEmailProps) => (
  <Html>
    <Head />
    <Preview>Μην ξεχάσεις τα προϊόντα στο καλάθι σου!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://i.postimg.cc/59LDxYRr/EpiplaGRAFEIOU.GR-removebg-preview2.png"
          width="180"
          height="40"
          alt="Epipla Grafeiou"
          style={logo}
        />
        <Text style={paragraph}>Γεια σου {customerFirstName},</Text>
        <Text style={paragraph}>
          Παρατηρήσαμε ότι άφησες μερικά υπέροχα προϊόντα στο καλάθι σου. Μην
          ανησυχείς, τα κρατήσαμε για σένα!
        </Text>

        <Section style={itemsContainer}>
          {cartItems.map((item) => (
            <Row style={itemRow} key={item.id}>
              <Column style={{ width: '80px' }}>
                <Img src={item.imageId} alt={item.name} width="64" height="64" style={itemImage} />
              </Column>
              <Column>
                <Text style={itemName}>{item.name}</Text>
                <Text style={itemDetails}>
                  {item.quantity} x {formatCurrency(item.price)}
                </Text>
              </Column>
              <Column align="right">
                <Text style={itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
              </Column>
            </Row>
          ))}
        </Section>

        <Hr style={hr} />

        <Row>
            <Column>
                <Text style={totalText}>Σύνολο</Text>
            </Column>
            <Column align="right">
                <Text style={totalPrice}>{cartTotal}</Text>
            </Column>
        </Row>

        <Section style={buttonContainer}>
          <Button style={button} href={`${baseUrl}/cart`}>
            Ολοκλήρωση Αγοράς
          </Button>
        </Section>

        <Text style={paragraph}>
          Αν έχεις οποιαδήποτε ερώτηση, απλά απάντησε σε αυτό το email. Είμαστε
          εδώ για να βοηθήσουμε!
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Epipla Grafeiou, Καναδά 11, 851 00 Ρόδος, Ελλάδα
        </Text>
      </Container>
    </Body>
  </Html>
);

export default AbandonedCartEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
};

const logo = {
  margin: '0 auto',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};

const itemsContainer = {
  border: '1px solid #cccccc',
  borderRadius: '5px',
  padding: '10px',
  marginTop: '20px',
};

const itemRow = {
  width: '100%',
  padding: '10px 0',
  borderBottom: '1px solid #eaeaea',
};

const itemImage = {
  borderRadius: '4px',
  objectFit: 'cover' as const,
};

const itemName = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0 0 5px 0',
};

const itemDetails = {
    fontSize: '14px',
    color: '#666666',
    margin: 0,
};

const itemPrice = {
    fontSize: '16px',
    fontWeight: 'bold' as const,
};

const totalText = {
  fontSize: '16px',
  paddingLeft: '10px',
};

const totalPrice = {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    paddingRight: '10px',
};


const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const button = {
  backgroundColor: '#1a73e8',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
};
